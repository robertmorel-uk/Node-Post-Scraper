# Node Post Scraper

This script enables me to scrape blog posts using an archive page url

## Getting Started

This script is not really set up for prodcution use, it's just me messing around. However you can use it if you like.

### Prerequisites

Node modules as required

## Deployment

Run from node prompt e.g. 

node index.js --pLoop='3' --archiveUrl='https://www.linklaters.com/en/insights/blogs/fintechlinks' --postUrls='.card__info > a' --postBodySelector='.col-md-7' --summarySelector='.col-md-7 h4'  --contentSelector=''
