# Time Sheet Entry Extension
This is a browser extension which adds a new row to my time-tracking spreadsheet with as efficient a UI as possible.
It's written for personal use, so take it with a grain of salt.

I did not write any lines of code for this project; I had Claude Sonnet 3.6 write the entire project and wrote up the experience in [this blog post](https://liquidbrain.net/blog/reflections-on-an-llm-only-coding-project/). 

## Time tracking spreadsheet
This extension only works for a time tracking spreadsheet with the following columns in this exact order:
`Date | Name | Time In | Time Out | Activity | Work Scope | Prio | Energy | Flow | Tags | Notes`

But of course you could modify this code as necessary.

## Features
- Quick entry form for time tracking data
- Keyboard shortcuts for efficient data entry
- Google Sheets integration
- Recent activity suggestions
- Tag management with autocomplete

## Setup

1. Copy the template files:
   ```bash
   cp background/background.js.template background/background.js
   cp popup/sheetsService.js.template popup/sheetsService.js
   ```
2. Configure OAuth:
    * Go to Google Cloud Console
    * Create a new project
    * Enable Google Sheets API
    * Create OAuth 2.0 credentials
    * Replace YOUR_CLIENT_ID in background.js with your client ID
3. Configure Sheets:
    * Create a Google Sheet
    * Copy the spreadsheet ID from its URL
    * Replace YOUR_SPREADSHEET_ID in sheetsService.js
    * Set your sheet name in sheetsService.js
4. Configure the sheets API call:
    * Enter your name in sheetsService.js
    * Enter the timezone you would like (line 14)

## Keyboard Shortcuts

* Alt+M: Open the extension popup
* Alt+L: Fill "Time In" with last clock-out time
* Alt+N: Fill time field with current time
* C/A/P: Select Core/Adjacent/Personal work scope
* Tab/Enter: Navigate between fields
* Ctrl+Enter: Submit form

## Browser Compatibility
Currently tested and working with Firefox. Uses Manifest V3.

For Chrome compatibility:
* Modify the manifest to use a service worker
* Replace all instances of "browser" with "chrome"
* Additional Chrome-specific changes may be needed

## Authorship of readme
If I had Claude Sonnet write the rest of the repo, would it really be that surprising if I had it help out with this too?
(The blog post is completely my work, however!)