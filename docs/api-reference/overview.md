# API Overview

Welcome to the Docusaurus API documentation. Our REST API provides programmatic access to all Docusaurus features and services.

## Quick Start

Get started with the Docusaurus API in minutes:

1. **Authentication**: Obtain your API keys from the admin dashboard
2. **Base URL**: All API requests are made to `https://api.docusaurus.io/v1/`
3. **Headers**: Include your API key in the `Authorization` header

## Authentication

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.docusaurus.io/v1/docs
```

## Rate Limits

- **Standard Plan**: 1,000 requests per hour
- **Pro Plan**: 10,000 requests per hour
- **Enterprise**: Custom limits available

## Support

Need help with the API? Check out the Docusaurus community forum or GitHub discussions.
