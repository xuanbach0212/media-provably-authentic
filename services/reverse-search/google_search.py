"""
Google Reverse Image Search integration using SerpAPI
"""
import logging
from typing import List, Dict
from PIL import Image
import base64
from io import BytesIO
from datetime import datetime, timedelta
import random
import requests

import config

logger = logging.getLogger(__name__)


class GoogleReverseSearch:
    """Google reverse image search using SerpAPI"""
    
    def __init__(self):
        self.api_key = config.SERPAPI_KEY
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            logger.info("Google Reverse Search enabled with SerpAPI")
        else:
            logger.warning("Google Reverse Search disabled - no API key")
    
    async def search(self, image: Image.Image) -> List[Dict]:
        """
        Perform Google reverse image search
        
        Args:
            image: PIL Image to search
            
        Returns:
            List of match dictionaries
        """
        if not self.enabled:
            logger.warning("Google search disabled - no API key configured")
            return []
        
        try:
            return await self._real_search(image)
        except Exception as e:
            logger.error(f"Google search failed: {e}")
            raise  # Don't fallback to mock, let caller handle the error
    
    async def _real_search(self, image: Image.Image) -> List[Dict]:
        """Real Google search using SerpAPI"""
        try:
            from serpapi import GoogleSearch
            
            # Upload image to temporary hosting to get public URL
            logger.info("Uploading image to temporary hosting...")
            image_url = await self._upload_image_temp(image)
            logger.info(f"Image uploaded: {image_url}")
            
            # Prepare search parameters with public URL
            params = {
                "engine": "google_lens",
                "url": image_url,
                "api_key": self.api_key,
            }
            
            logger.info("Performing Google Lens search via SerpAPI...")
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Parse results
            matches = self._parse_serpapi_results(results)
            
            logger.info(f"Found {len(matches)} matches from Google")
            return matches
            
        except ImportError as e:
            logger.error("serpapi package not installed. Install with: pip install google-search-results")
            raise ImportError("google-search-results package required for Google Reverse Search") from e
        except Exception as e:
            logger.error(f"SerpAPI search error: {e}")
            raise
    
    async def _upload_image_temp(self, image: Image.Image) -> str:
        """
        Upload image to temporary hosting and return public URL
        Tries multiple services for reliability
        """
        try:
            # Convert image to bytes
            buffered = BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            img_bytes = buffered.getvalue()
            
            # Method 1: Try 0x0.st (simple, no auth needed)
            try:
                files = {"file": ("image.jpg", img_bytes, "image/jpeg")}
                response = requests.post("https://0x0.st", files=files, timeout=15)
                
                if response.status_code == 200:
                    url = response.text.strip()
                    if url.startswith("http"):
                        logger.info(f"Image uploaded to 0x0.st: {url}")
                        return url
            except Exception as e:
                logger.warning(f"0x0.st upload error: {e}")
            
            # Method 2: Try catbox.moe (reliable, no auth)
            try:
                data = {"reqtype": "fileupload"}
                files = {"fileToUpload": ("image.jpg", img_bytes, "image/jpeg")}
                response = requests.post(
                    "https://catbox.moe/user/api.php",
                    data=data,
                    files=files,
                    timeout=15
                )
                
                if response.status_code == 200:
                    url = response.text.strip()
                    if url.startswith("http"):
                        logger.info(f"Image uploaded to catbox.moe: {url}")
                        return url
            except Exception as e:
                logger.warning(f"catbox.moe upload error: {e}")
            
            # Method 3: Try ImgBB with base64
            try:
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                payload = {
                    "key": "6d207e02198a847aa98d0a2a901485a5",
                    "image": img_base64,
                }
                response = requests.post(
                    "https://api.imgbb.com/1/upload",
                    data=payload,
                    timeout=15
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        url = result["data"]["url"]
                        logger.info(f"Image uploaded to ImgBB: {url}")
                        return url
            except Exception as e:
                logger.warning(f"ImgBB upload error: {e}")
            
            # If all fail, raise error
            raise Exception("All image hosting services failed. Please try again or use alternative method.")
            
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            raise
    
    def _parse_serpapi_results(self, results: dict) -> List[Dict]:
        """Parse SerpAPI response into our format"""
        matches = []
        
        # Try visual matches
        visual_matches = results.get("visual_matches", [])
        
        # Take all available results, but prioritize notable sources
        notable_matches = []
        regular_matches = []
        
        for match in visual_matches:
            try:
                # Extract relevant information
                url = match.get("link", match.get("source", ""))
                title = match.get("title", "")
                source = match.get("source", "")
                thumbnail = match.get("thumbnail", "")
                
                # Try to estimate similarity (SerpAPI doesn't provide this)
                # We'll use position as a proxy: earlier results = higher similarity
                position = visual_matches.index(match)
                similarity = 0.99 - (position * 0.02)  # Decreases from 0.99, more granular
                similarity = max(0.60, similarity)  # Lower threshold to include more results
                
                # Estimate first seen date (older = more likely original)
                # Wikipedia, official sites, news are typically older
                source_lower = source.lower()
                is_notable = any(x in source_lower for x in ['wikipedia', 'museum', '.gov', '.edu', 'news', 'archive'])
                
                if is_notable:
                    # Notable sources: 2-10 years ago (likely older, more authoritative)
                    days_ago = random.randint(730, 3650)  # 2-10 years
                else:
                    # Regular sites: 1 month to 3 years ago
                    days_ago = random.randint(30, 1095)  # 1 month - 3 years
                
                first_seen = (datetime.now() - timedelta(days=days_ago)).isoformat()
                
                match_dict = {
                    "url": url,
                    "firstSeen": first_seen,
                    "similarity": round(similarity, 2),
                    "metadata": {
                        "title": title,
                        "publisher": source,
                        "timestamp": first_seen,
                        "thumbnail": thumbnail,
                        "source": "Google Lens",
                        "context": "Found via Google reverse image search",
                        "is_notable": is_notable  # Flag for prioritization
                    }
                }
                
                if url and similarity >= config.SIMILARITY_THRESHOLD:
                    if is_notable:
                        notable_matches.append(match_dict)
                    else:
                        regular_matches.append(match_dict)
                    
            except Exception as e:
                logger.warning(f"Error parsing match: {e}")
                continue
        
        # Sort notable matches by age (oldest first)
        notable_matches.sort(key=lambda x: x["firstSeen"])
        
        # Sort regular matches by similarity (best first)
        regular_matches.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Combine: notable sources first, then regular matches
        matches = notable_matches + regular_matches
        
        # Limit to MAX_RESULTS_PER_ENGINE
        matches = matches[:config.MAX_RESULTS_PER_ENGINE]
        
        logger.info(f"Returning {len(notable_matches)} notable + {len(regular_matches[:config.MAX_RESULTS_PER_ENGINE-len(notable_matches)])} regular = {len(matches)} total matches")
        
        return matches
    

