<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
    <img src="assets/platinum-hunters-gr.png" alt="Logo" width="339" height="149">

  <h3 align="center">Platinum Hunters GR</h3>

  <p align="center">
    This is a platform to help users find **trophy guides** for various games. It offers a variety of features to enhance the gaming experience and allows users to track their progress in achieving trophies.
    <br />
    <br />
    <a href="https://platinum-hunters-gr.vercel.app/" target="_blank">View MVP</a>
    ·
    <a href="https://platinum-hunters-gr.vercel.app/pages/contact">Report Bug</a>
    ·
    <a href="https://github.com/Michalis89/Platinum-Hunters-GR/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#deployment">Deployment</a></li>
      </ul>
    </li>
    <li><a href="#api-usage">API</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

<div id="about-the-project"></div>

[![Product Name Screen Shot][product-screenshot]](https://platinum-hunters-gr.vercel.app/pages/guide)

# Platinum Hunters GR

Platinum Hunters GR is a platform designed to help users find **trophy guides** for various games. It offers a variety of features to enhance the gaming experience:

- **Search for Trophy Guides**: Users can search for detailed guides on how to achieve specific trophies for their favorite games.
- **Browse and Create Guides**: In the future, users will be able to create their own guides, share them with the community, and help others earn trophies.

## Upcoming Features

In the future, Platinum Hunters GR will include more advanced functionalities:

1. **User Accounts**: Users will be able to create an account and save their progress.
2. **Request Permissions**: Users can request permissions to:
   - Create and manage their own **guides**.
   - Write **reviews** on existing guides and games.
   - Publish **news articles** related to trophies and gaming.
3. **Create Guides, Reviews, and Articles**: Users will have the ability to contribute to the platform by creating:
   - **Guides** to help other users achieve specific trophies.
   - **Reviews** to share their thoughts on games and guides.
   - **Articles** to stay updated on the latest gaming news, tips, and tricks.

Platinum Hunters GR is constantly evolving to provide a better experience for its community. Stay tuned for these exciting updates!

<p align="right">(<a href="#top">back to top</a>)</p>

### Built With

<div id="built-with"></div>

Below are the technologies used to bootstrap and deploy the project:

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Rawg API](https://rawg.io/apidocs)
- [Vercel](https://vercel.com/)

<!-- GETTING STARTED -->

## Getting Started

<div id="getting-started"></div>

Set up your project locally.
To get a local copy up and running follow these simple steps.

For starters if don't have NodeJs at your local machine you have to install <a href="https://nodejs.org/en/download/">from here</a>

- npm

  ```sh
  npm install npm@latest -g

  ```

### Installation

<div id="installation"></div>

1. Clone the repo

   ```sh
   git clone https://github.com/Michalis89/Platinum-Hunters-GR.git

   ```

2. Install NPM packages

   ```sh
   npm install

   ```

3. Set up the environment:
   Create the `.env.local` file and add the following variables:

   ```sh
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   RAWG_API_KEY=your_api_key

   ```

4. Run the development server

   ```sh
   npm run dev

   ```

### Deployment

<div id="deployment"></div>

To deploy the app on Vercel:

1. Build the app

   ```sh
   npm run build

   ```

### Deploy using Vercel's CLI or GUI

1. **Install Vercel CLI**

   ```sh
   npm install -g vercel

   ```

2. **Login to Vercel**

   ```sh
   vercel login

   ```

3. **Deploy the project**

   ```sh
   vercel

   ```

  <p align="right">(<a href="#top">back to top</a>)</p>

<!-- Test Coverage -->

## Test Coverage

To check the test coverage, run:

```sh

npm run test:coverage

```

![Coverage](https://coveralls.io/repos/github/Michalis89/Platinum-Hunters-GR/badge.svg?branch=develop)

## Test Coverage Results
  
<details>
  <summary><strong>Click to expand Test Coverage Results</strong></summary>
  <div id="results">
    <table>
      <tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr>
      <tr>
        <td><strong>All files</strong></td>
        <td><span style="color: red;">14.54%</span></td>
        <td><span style="color: orange;">53.19%</span></td>
        <td><span style="color: red;">26.67%</span></td>
        <td><span style="color: red;">14.54%</span></td>
        <td>-</td>
      </tr>
<tr>
<td>layout.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>route.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Navbar.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: orange;">66.67%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>NavbarWrapper.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>BugReportForm.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>FeatureRequestForm.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GeneralQuestionForm.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>NewGuideForm.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>SupportForm.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>EditGuideButton.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GameDetailsInfo.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GamePlatforms.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GuideStats.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>TrophyGuides.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>TrophyStats.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>UpdateGameInfoButton.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GameCard.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>GameGrid.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>SearchBar.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>AlertMessage.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Badge.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Button.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Card.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Dropdown.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>FormErrorMessage.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Input.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>Skeleton.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>UnderConstruction.tsx</td>
<td><span style="color: green;">97.10%</span></td>
<td><span style="color: green;">80.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">97.10%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>page.tsx</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>db.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>index.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>selectors.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>utils.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>handlers.ts</td>
<td><span style="color: green;">92.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: green;">92.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>server.ts</td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: green;">100.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>forms.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
<tr>
<td>interfaces.ts</td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td><span style="color: red;">0.00%</span></td>
<td>-</td>
</tr>
    </table>
  </div>
</details>

  <div id="jest-results">
    <h3>Test Summary</h3>
    <p><strong>Test Suites:</strong> 16 passed, 16 total</p>
    <p><strong>Tests:</strong> 44 passed, 0 failed, 44 total</p>
    <p><strong>Time:</strong> 41.11 seconds</p>
  </div>

## License

Distributed under the [MIT License](./LICENSE.txt). See for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[product-screenshot]: assets/screenshot.png

<div id="jest-results">
<h3>Test Summary</h3>
<p><strong>Test Suites:</strong> 16 passed, 16 total</p>
<p><strong>Tests:</strong> 44 passed, 0 failed, 44 total</p>
<p><strong>Time:</strong> 41.11 seconds</p>
</div>

<div id="jest-results">
<h3>Test Summary</h3>
<p><strong>Test Suites:</strong> 16 passed, 16 total</p>
<p><strong>Tests:</strong> 44 passed, 0 failed, 44 total</p>
<p><strong>Time:</strong> 41.11 seconds</p>
</div>
