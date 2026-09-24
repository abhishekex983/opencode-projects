# Pinterest Pin Generation - Context

## Brand Kit
- Main color: #002444 (dark navy)
- Secondary color: #b91c1c (red)

## Logo (STRICTLY use only these files)
- Light backgrounds: F:\Opencode Projects\Hair Restoration\Media\Thin Hair Growth Guide logo.png
- Dark backgrounds: F:\Opencode Projects\Hair Restoration\Media\Thin Hair Growth Guide ( White logo).png
- Placement: Bottom-right corner, ~8-10% of image width, clear padding from edges

## kie.ai API (Updated)
- Endpoint: POST https://api.kie.ai/api/v1/jobs/createTask
- Bearer token: f648e74c259486f82080834408927570
- Model: gpt-image-2-image-to-image (supports reference images)
- Aspect ratio: 2:3 (Pinterest portrait), 9:16 (YouTube Short)
- Resolution: 2K

## Correct Request Format
Parameters MUST go inside an 'input' object:

`json
{
  "model": "gpt-image-2-image-to-image",
  "callBackUrl": "https://webhook.site/...",
  "input": {
    "prompt": "<prompt text>",
    "input_urls": ["<hero image URL>"],
    "aspect_ratio": "2:3",
    "resolution": "2K"
  }
}
`

## Polling (Check Task Status)
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}

Response:
`json
{
  "code": 200,
  "data": {
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://tempfile.aiquickdraw.com/...\"]}"
  }
}
`

## Audience
- Male: direct, bold, no fluff
- Sharp geometry, strong contrast
- Cool/neutral tones
- No logo on pins
