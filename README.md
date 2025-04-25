![](./public/og.jpg)

# SmartPDF 📄✨

SmartPDF is an intelligent PDF processing tool that automatically generates concise summaries of your PDF documents. It breaks down complex documents into digestible sections, making it easier to understand and share key information.

## Features

- 🚀 **Quick Summaries**: Get instant, AI-powered summaries of your PDF documents
- 📑 **Smart Sectioning**: Automatically breaks down documents into logical sections
- 🔗 **Easy Sharing**: Share summaries with others via quick links
- 🖼️ **Cover image**: View a Flux rendering of a beautiful cover image of your PDF

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Prisma with PostgreSQL (Neon)
- **AI Processing**: Together AI
- **Storage**: S3 for PDF storage

## Getting Started

### Prerequisites

- Node.js 20.x
- PNPM package manager
- PostgreSQL database
- Together AI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL=your_database_url
   # Add other required environment variables
   ```
4. Generate Prisma client:
   ```bash
   pnpm prisma generate
   ```
5. Start the development server:
   ```bash
   pnpm dev
   ```

## Usage

1. Upload your PDF document
2. Wait for the AI to process and generate summaries
3. Navigate through sections using the table of contents
4. Share the summary with others using the share button
5. Access the original PDF anytime via the "Original PDF" button

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/Nutlope/smartpdfs">Hassan El Mghari</a></p>
  <p>Powered by <a href="https://together.link/">Together AI</a></p>
</div>

## Roadmap

- [ ] Add plausible analytics for better insights
- [ ] Implement additional revision steps for improved summaries
- [ ] Add demo PDF for new users
- [ ] Implement section combining for better organization
- [ ] Add feedback system with thumbs up/down feature
- [ ] Integrate OCR for image parsing in PDFs
