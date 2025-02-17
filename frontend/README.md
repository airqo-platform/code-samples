# AirQo AI Platform

## Overview

AirQo AI is an advanced air quality monitoring and forecasting platform designed to efficiently collect, analyze, and forecast air quality data across Africa. Our mission is to provide accurate insights and raise awareness about air pollution in African cities.

![AirQo AI Platform](https://placeholder.com/airqo-platform-screenshot.png)

## Features

- **Interactive Map**: Real-time visualization of air quality data across various locations.
- **Site Locator**: AI-powered tool to suggest optimal locations for new air quality sensors.
- **Site Categorization**: Automatically categorize sites based on their characteristics and surrounding environment.
- **Air Quality Reports**: Generate comprehensive reports with historical data and trends.
- **About Page**: Information about AirQo's mission and impact.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/your-username/airqo-ai-platform.git
   cd airqo-ai-platform
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   # or
   yarn install
   \`\`\`

3. Set up environment variables:
   Create a \`.env.local\` file in the root directory and add the following variables:
   \`\`\`
    NEXT_PUBLIC_API_TOKEN=your_api_token_here   
    NEXT_PUBLIC_LOCATE_API_URL=https://platform.airqo.net/api/v2/spatial/site_location
    NEXT_PUBLIC_SITE_CATEGORY_API_URL=https://platform.airqo.net/api/v2/spatial/categorize_site
    NEXT_PUBLIC_AIR_QUALITY_REPORT_API_URL_LLM=https://platform.airqo.net/api/v2/spatial/air_quality_report
    NEXT_PUBLIC_SATELLITE_DATA_API_URL=https://platform.airqo.net/api/v2/spatial/satellite_prediction
    NEXT_PUBLIC_DEVICE_DATA_API_URL=https://analytics.airqo.net/api/v2/devices/readings/map
    NEXT_PUBLIC_GRID_SUMMARY_API_URL=https://platform.airqo.net/api/v2/devices/grids/summary?
   \`\`\`

4. Run the development server:
   \`\`\`
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Home Page
The home page displays an interactive map with real-time air quality data. Users can:
- Search for specific locations
- View air quality information for different sites
- Toggle between street and satellite map views

### Locate Page
Use the Site Locator tool to find optimal locations for new air quality sensors:
1. Draw a polygon on the map to define the area of interest
2. Set parameters such as the number of sensors and minimum distance between them
3. Add must-have locations if needed
4. Submit the request to receive AI-generated suggestions for sensor placements

### Categorize Page
Categorize sites based on their characteristics:
1. Click on the map or upload a CSV file with site coordinates
2. View the AI-generated category for each site
3. Export the results as a CSV file

### Reports Page
Generate comprehensive air quality reports:
1. Select a grid and date range
2. View visualizations of air quality trends
3. Access AI-generated insights and recommendations

### About Page
Learn more about AirQo's mission, core values, and impact in air quality monitoring across Africa.

## Deployment

The easiest way to deploy your AirQo AI Platform is to use the [Vercel Platform](https://vercel.com) from the creators of Next.js.

### Deploying on Vercel

1. Sign up for a Vercel account if you haven't already: [https://vercel.com/signup](https://vercel.com/signup)

2. Install the Vercel CLI:
   \`\`\`
   npm i -g vercel
   \`\`\`

3. Run the following command from your project's root directory:
   \`\`\`
   vercel
   \`\`\`

4. Follow the prompts to link your project to Vercel and configure your deployment settings.

5. Once deployed, Vercel will provide you with a URL for your live application.

### Continuous Deployment

Vercel supports continuous deployment with GitHub, GitLab, and Bitbucket. When you push changes to your repository, Vercel will automatically deploy the updates.

To set up continuous deployment:

1. Connect your Git repository to your Vercel project.
2. Configure your project settings on the Vercel dashboard.
3. Push changes to your repository, and Vercel will automatically build and deploy your updates.

For more detailed information about deploying Next.js applications on Vercel, check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Leaflet (for maps)
- Shadcn UI components
- Lucide React icons

## Contributing

We welcome contributions to the AirQo AI Platform! Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (\`git checkout -b feature/your-feature-name\`)
3. Make your changes
4. Commit your changes (\`git commit -am 'Add some feature'\`)
5. Push to the branch (\`git push origin feature/your-feature-name\`)
6. Create a new Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or support, please contact us at support@airqo.net or visit our website [https://www.airqo.net](https://www.airqo.net).

