"""
Perceptual Hash Database for fast similarity matching
"""
import json
import os
import logging
from typing import List, Dict, Optional
from PIL import Image
import imagehash
from datetime import datetime

import config

logger = logging.getLogger(__name__)


class PHashDatabase:
    """Local database for perceptual hash matching"""
    
    def __init__(self, db_path: str = config.PHASH_DB_PATH):
        self.db_path = db_path
        self.db = {}
        self.load_db()
    
    def load_db(self):
        """Load database from disk"""
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, 'r') as f:
                    self.db = json.load(f)
                logger.info(f"Loaded {len(self.db)} hashes from database")
            except Exception as e:
                logger.error(f"Error loading pHash database: {e}")
                self.db = {}
        else:
            logger.info("No pHash database found, starting fresh")
            self.db = {}
    
    def save_db(self):
        """Save database to disk"""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with open(self.db_path, 'w') as f:
                json.dump(self.db, f, indent=2)
            logger.info(f"Saved {len(self.db)} hashes to database")
        except Exception as e:
            logger.error(f"Error saving pHash database: {e}")
    
    def add_image(self, url: str, image: Image.Image, metadata: Optional[Dict] = None):
        """Add an image hash to the database"""
        try:
            # Compute perceptual hash
            phash = str(imagehash.phash(image))
            
            # Store entry
            self.db[phash] = {
                "url": url,
                "added_at": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
            # Save periodically
            if len(self.db) % 10 == 0:
                self.save_db()
                
        except Exception as e:
            logger.error(f"Error adding image to pHash database: {e}")
    
    def search(self, image: Image.Image, threshold: int = config.PHASH_THRESHOLD) -> List[Dict]:
        """
        Search for similar images by perceptual hash
        
        Args:
            image: PIL Image to search
            threshold: Maximum hamming distance for matches
            
        Returns:
            List of match dictionaries
        """
        try:
            # Compute hash of query image
            query_hash = imagehash.phash(image)
            
            matches = []
            
            # Compare with all stored hashes
            for stored_hash_str, entry in self.db.items():
                try:
                    stored_hash = imagehash.hex_to_hash(stored_hash_str)
                    distance = query_hash - stored_hash
                    
                    if distance <= threshold:
                        # Calculate similarity (0-1) from distance
                        # 0 distance = 1.0 similarity, threshold distance = 0.7 similarity
                        similarity = 1.0 - (distance / (threshold * 2))
                        similarity = max(0.7, min(1.0, similarity))
                        
                        match = {
                            "url": entry["url"],
                            "firstSeen": entry.get("added_at", datetime.now().isoformat()),
                            "similarity": round(similarity, 2),
                            "metadata": {
                                **entry.get("metadata", {}),
                                "source": "pHash Database",
                                "hamming_distance": int(distance),
                                "phash": stored_hash_str
                            }
                        }
                        matches.append(match)
                        
                except Exception as e:
                    logger.warning(f"Error comparing hash {stored_hash_str}: {e}")
                    continue
            
            # Sort by similarity (highest first)
            matches.sort(key=lambda x: x["similarity"], reverse=True)
            
            logger.info(f"Found {len(matches)} pHash matches")
            return matches[:config.MAX_RESULTS_PER_ENGINE]
            
        except Exception as e:
            logger.error(f"pHash search error: {e}")
            return []
    
    def populate_from_known_sources(self, sources: List[Dict]):
        """
        Populate database from known authentic sources
        
        Args:
            sources: List of dicts with 'url' and 'image_path' keys
        """
        for source in sources:
            try:
                image = Image.open(source['image_path'])
                self.add_image(
                    url=source['url'],
                    image=image,
                    metadata=source.get('metadata', {})
                )
            except Exception as e:
                logger.error(f"Error loading source {source.get('url')}: {e}")
        
        self.save_db()
        logger.info(f"Populated database with {len(sources)} sources")

