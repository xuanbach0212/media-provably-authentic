import hashlib
import logging
from datetime import datetime, timedelta
from PIL import Image
from typing import List, Dict, Optional
import random

logger = logging.getLogger(__name__)

class ReverseSearchEngine:
    """
    Reverse image search engine
    
    For hackathon: Uses mock data
    In production: Would integrate with:
    - Google Reverse Image Search (via SerpAPI)
    - TinEye API
    - Bing Visual Search
    - Custom perceptual hash database
    """
    
    def __init__(self):
        self.mock_mode = True  # Set to False when real APIs are configured
        
    async def search(self, image: Image.Image, filename: Optional[str] = None) -> dict:
        """
        Perform reverse image search
        """
        logger.info(f"Starting reverse search for image {image.size}")
        
        if self.mock_mode:
            return self._mock_search(image, filename)
        else:
            return await self._real_search(image, filename)
    
    def _mock_search(self, image: Image.Image, filename: Optional[str] = None) -> dict:
        """
        Mock reverse search for development
        Returns simulated provenance data
        """
        # Generate deterministic results based on image characteristics
        img_hash = hashlib.md5(image.tobytes()).hexdigest()
        random.seed(img_hash)
        
        # Simulate finding 0-3 matches
        num_matches = random.randint(0, 3)
        
        matches = []
        if num_matches > 0:
            base_date = datetime.now() - timedelta(days=random.randint(30, 365))
            
            for i in range(num_matches):
                # Simulate older dates for earlier matches
                first_seen = (base_date - timedelta(days=i * 30)).isoformat()
                similarity = random.uniform(0.7, 0.98)
                
                match = {
                    "url": f"https://example.com/media/{img_hash[:8]}/source{i}",
                    "firstSeen": first_seen,
                    "similarity": round(similarity, 2),
                    "metadata": {
                        "title": f"Original Source {i+1}",
                        "publisher": random.choice([
                            "News Agency A",
                            "Photographer B", 
                            "Stock Photo Site",
                            "Social Media Platform"
                        ]),
                        "timestamp": first_seen,
                        "context": "Found via reverse image search"
                    }
                }
                matches.append(match)
        
        # Sort by first seen (earliest first)
        matches.sort(key=lambda x: x["firstSeen"])
        
        # Build provenance chain
        provenance_chain = [match["url"] for match in matches]
        
        # Determine earliest match
        earliest_match = matches[0] if matches else None
        
        # Calculate confidence based on number and quality of matches
        if not matches:
            confidence = 0.0
        elif len(matches) == 1:
            confidence = matches[0]["similarity"] * 0.6
        else:
            avg_similarity = sum(m["similarity"] for m in matches) / len(matches)
            confidence = avg_similarity * 0.8
        
        return {
            "matches": matches,
            "earliestMatch": earliest_match,
            "provenanceChain": provenance_chain,
            "confidence": round(confidence, 2)
        }
    
    async def _real_search(self, image: Image.Image, filename: Optional[str] = None) -> dict:
        """
        Real reverse search using APIs
        TODO: Implement when API keys are available
        """
        matches = []
        
        # Google Reverse Image Search (via SerpAPI)
        # google_matches = await self._search_google(image)
        # matches.extend(google_matches)
        
        # TinEye API
        # tineye_matches = await self._search_tineye(image)
        # matches.extend(tineye_matches)
        
        # Bing Visual Search
        # bing_matches = await self._search_bing(image)
        # matches.extend(bing_matches)
        
        # Deduplicate and sort
        matches = self._deduplicate_matches(matches)
        matches.sort(key=lambda x: x["firstSeen"])
        
        provenance_chain = [match["url"] for match in matches]
        earliest_match = matches[0] if matches else None
        
        confidence = self._calculate_confidence(matches)
        
        return {
            "matches": matches,
            "earliestMatch": earliest_match,
            "provenanceChain": provenance_chain,
            "confidence": confidence
        }
    
    def _deduplicate_matches(self, matches: List[dict]) -> List[dict]:
        """Remove duplicate URLs"""
        seen_urls = set()
        unique_matches = []
        
        for match in matches:
            if match["url"] not in seen_urls:
                seen_urls.add(match["url"])
                unique_matches.append(match)
        
        return unique_matches
    
    def _calculate_confidence(self, matches: List[dict]) -> float:
        """Calculate overall confidence based on matches"""
        if not matches:
            return 0.0
        
        avg_similarity = sum(m["similarity"] for m in matches) / len(matches)
        match_bonus = min(len(matches) * 0.1, 0.3)
        
        return min(avg_similarity + match_bonus, 1.0)

