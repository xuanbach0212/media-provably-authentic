import hashlib
import logging
from datetime import datetime, timedelta
from PIL import Image
from typing import List, Dict, Optional
import random

import config
from google_search import GoogleReverseSearch
from phash_db import PHashDatabase
from crawler import MetadataCrawler

logger = logging.getLogger(__name__)


class ReverseSearchEngine:
    """
    Comprehensive reverse image search engine
    
    Combines multiple search methods:
    - Google Reverse Image Search (SerpAPI)
    - Perceptual Hash Database
    - TinEye (optional, if API key provided)
    """
    
    def __init__(self):
        self.google_search = GoogleReverseSearch()
        self.phash_db = PHashDatabase()
        self.crawler = MetadataCrawler()
        
        logger.info(f"Reverse Search Engine initialized")
        logger.info(f"  - Google Search: {'Enabled' if self.google_search.enabled else 'Mock mode'}")
        logger.info(f"  - pHash Database: {len(self.phash_db.db)} entries")
        logger.info(f"  - Metadata Crawler: Enabled")
        
    async def search(self, image: Image.Image, filename: Optional[str] = None) -> dict:
        """
        Perform comprehensive reverse image search
        
        Args:
            image: PIL Image to search
            filename: Optional filename for context
            
        Returns:
            Dictionary with search results
        """
        logger.info(f"Starting reverse search for image {image.size}")
        
        all_matches = []
        
        # 1. Google Reverse Search
        try:
            logger.info("Running Google reverse search...")
            google_matches = await self.google_search.search(image)
            all_matches.extend(google_matches)
            logger.info(f"Google found {len(google_matches)} matches")
        except Exception as e:
            logger.error(f"Google search failed: {e}")
        
        # 2. Perceptual Hash Search
        try:
            logger.info("Running pHash database search...")
            phash_matches = self.phash_db.search(image)
            all_matches.extend(phash_matches)
            logger.info(f"pHash found {len(phash_matches)} matches")
        except Exception as e:
            logger.error(f"pHash search failed: {e}")
        
        # 3. Deduplicate matches by URL
        unique_matches = self._deduplicate_matches(all_matches)
        
        # 4. Sort by first seen date (earliest first)
        unique_matches.sort(key=lambda x: x.get("firstSeen", "9999"))
        
        # 5. Enrich top matches with crawled metadata
        if unique_matches and not config.MOCK_MODE:
            unique_matches = await self._enrich_with_metadata(unique_matches[:5])
        
        # 6. Build provenance chain
        provenance_chain = [match["url"] for match in unique_matches]
        
        # 7. Find earliest match
        earliest_match = unique_matches[0] if unique_matches else None
        
        # 8. Calculate overall confidence
        confidence = self._calculate_confidence(unique_matches)
        
        result = {
            "matches": unique_matches[:config.MAX_RESULTS_PER_ENGINE],
            "earliestMatch": earliest_match,
            "provenanceChain": provenance_chain[:config.MAX_RESULTS_PER_ENGINE],
            "confidence": confidence
        }
        
        logger.info(f"Search complete: {len(unique_matches)} total matches, confidence: {confidence:.2f}")
        return result
    
    def _deduplicate_matches(self, matches: List[Dict]) -> List[Dict]:
        """Remove duplicate URLs, keeping the best match for each"""
        seen_urls = {}
        
        for match in matches:
            url = match.get("url", "")
            if not url:
                continue
            
            # If we haven't seen this URL, add it
            if url not in seen_urls:
                seen_urls[url] = match
            else:
                # Keep the match with higher similarity
                existing = seen_urls[url]
                if match.get("similarity", 0) > existing.get("similarity", 0):
                    seen_urls[url] = match
        
        return list(seen_urls.values())
    
    async def _enrich_with_metadata(self, matches: List[Dict]) -> List[Dict]:
        """Enrich matches with crawled metadata"""
        enriched = []
        
        for match in matches:
            try:
                url = match.get("url", "")
                if url and not url.startswith("https://example.com"):  # Skip mock URLs
                    # Crawl metadata
                    metadata = self.crawler.crawl(url)
                    
                    # Merge with existing metadata
                    if "error" not in metadata:
                        match["metadata"] = {
                            **match.get("metadata", {}),
                            **metadata
                        }
                        
                        # Update firstSeen if we found a publish date
                        if metadata.get("publish_date"):
                            match["firstSeen"] = metadata["publish_date"]
                
            except Exception as e:
                logger.warning(f"Error enriching match {match.get('url')}: {e}")
            
            enriched.append(match)
        
        return enriched
    
    def _calculate_confidence(self, matches: List[Dict]) -> float:
        """
        Calculate overall confidence in the search results
        
        Factors:
        - Number of matches found
        - Average similarity score
        - Quality of matches (have metadata, multiple sources)
        """
        if not matches:
            return 0.0
        
        # Base confidence from number of matches
        num_matches = len(matches)
        match_bonus = min(num_matches * 0.15, 0.45)  # Up to 0.45 for 3+ matches
        
        # Average similarity
        avg_similarity = sum(m.get("similarity", 0) for m in matches) / len(matches)
        
        # Quality bonus (matches with good metadata)
        quality_matches = sum(
            1 for m in matches 
            if m.get("metadata", {}).get("title") or m.get("metadata", {}).get("publisher")
        )
        quality_bonus = (quality_matches / len(matches)) * 0.15
        
        # Combine factors
        confidence = (avg_similarity * 0.6) + match_bonus + quality_bonus
        
        return round(min(confidence, 1.0), 2)
