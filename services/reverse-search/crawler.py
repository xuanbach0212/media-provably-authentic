"""
Metadata crawler for extracting information from provenance URLs
"""
import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
from datetime import datetime
import re

import config

logger = logging.getLogger(__name__)


class MetadataCrawler:
    """Crawl and extract metadata from web pages"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def crawl(self, url: str) -> Dict:
        """
        Crawl a URL and extract metadata
        
        Args:
            url: URL to crawl
            
        Returns:
            Dictionary with extracted metadata
        """
        try:
            logger.info(f"Crawling metadata from: {url}")
            
            response = self.session.get(
                url,
                timeout=config.CRAWLER_TIMEOUT,
                allow_redirects=True
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            metadata = {
                "url": url,
                "crawled_at": datetime.now().isoformat(),
            }
            
            # Extract title
            metadata["title"] = self._extract_title(soup)
            
            # Extract description
            metadata["description"] = self._extract_description(soup)
            
            # Extract publish date
            metadata["publish_date"] = self._extract_date(soup, response.text)
            
            # Extract author
            metadata["author"] = self._extract_author(soup)
            
            # Extract publisher
            metadata["publisher"] = self._extract_publisher(soup, url)
            
            # Extract Open Graph data
            metadata["og_data"] = self._extract_open_graph(soup)
            
            logger.info(f"Successfully crawled metadata from {url}")
            return metadata
            
        except requests.Timeout:
            logger.warning(f"Timeout crawling {url}")
            return {"url": url, "error": "timeout"}
        except requests.RequestException as e:
            logger.warning(f"Error crawling {url}: {e}")
            return {"url": url, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error crawling {url}: {e}")
            return {"url": url, "error": str(e)}
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract page title"""
        # Try og:title first
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"]
        
        # Try regular title tag
        title_tag = soup.find("title")
        if title_tag:
            return title_tag.get_text().strip()
        
        # Try h1
        h1 = soup.find("h1")
        if h1:
            return h1.get_text().strip()
        
        return None
    
    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract page description"""
        # Try og:description
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc["content"]
        
        # Try meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc["content"]
        
        return None
    
    def _extract_date(self, soup: BeautifulSoup, html: str) -> Optional[str]:
        """Extract publish date"""
        # Try article:published_time
        og_published = soup.find("meta", property="article:published_time")
        if og_published and og_published.get("content"):
            return og_published["content"]
        
        # Try various date patterns in meta tags
        date_patterns = [
            {"property": "article:modified_time"},
            {"name": "publish-date"},
            {"name": "date"},
            {"itemprop": "datePublished"},
        ]
        
        for pattern in date_patterns:
            date_tag = soup.find("meta", attrs=pattern)
            if date_tag and date_tag.get("content"):
                return date_tag["content"]
        
        # Try to find date in time tags
        time_tag = soup.find("time")
        if time_tag and time_tag.get("datetime"):
            return time_tag["datetime"]
        
        return None
    
    def _extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract author name"""
        # Try article:author
        og_author = soup.find("meta", property="article:author")
        if og_author and og_author.get("content"):
            return og_author["content"]
        
        # Try meta author
        meta_author = soup.find("meta", attrs={"name": "author"})
        if meta_author and meta_author.get("content"):
            return meta_author["content"]
        
        # Try rel="author"
        author_link = soup.find("a", rel="author")
        if author_link:
            return author_link.get_text().strip()
        
        return None
    
    def _extract_publisher(self, soup: BeautifulSoup, url: str) -> Optional[str]:
        """Extract publisher/site name"""
        # Try og:site_name
        og_site = soup.find("meta", property="og:site_name")
        if og_site and og_site.get("content"):
            return og_site["content"]
        
        # Extract from domain
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            # Remove www. and TLD
            publisher = domain.replace("www.", "").split(".")[0]
            return publisher.title()
        except:
            return None
    
    def _extract_open_graph(self, soup: BeautifulSoup) -> Dict:
        """Extract all Open Graph metadata"""
        og_data = {}
        
        og_tags = soup.find_all("meta", property=re.compile("^og:"))
        for tag in og_tags:
            property_name = tag.get("property", "").replace("og:", "")
            content = tag.get("content")
            if property_name and content:
                og_data[property_name] = content
        
        return og_data

