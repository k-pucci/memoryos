# Cognote

## Overview

Cognote is a modern personal knowledge management system that combines AI-powered search with intuitive memory organization. Built with Next.js 15 and featuring a clean, professional interface, it helps users capture, organize, and retrieve their thoughts, notes, and insights with powerful semantic search capabilities.

## Live Demo

**Try Cognote now:** [memorys-live.vercel.app](https://memoryos-live.vercel.app)

> **Demo Environment**: This is a public demo instance. Please do not enter any sensitive or personal information.

## Key Features

### Smart Memory Management

- **AI-Powered Search**: Semantic search using embeddings for intelligent content discovery
- **Memory Creation**: Rich text editor with categorization and tagging
- **Memory Detail Views**: Full-featured editing with 2-column layout consistency
- **Dynamic Memory Cards**: Clean card-based interface with category color coding

### AI Integration

- **Unified Chat Interface**: Natural language conversations about your memories
- **Groq AI Integration**: Fast, intelligent responses powered by advanced language models
- **Semantic Search**: Vector-based search for finding related content
- **AI Embeddings**: Automatic content analysis for better organization

### Knowledge Organization

- **Memory Library**: Centralized hub for all your captured knowledge
- **Advanced Filtering**: Search by category, type, tags, and date ranges
- **Smart Categorization**: Research, Product, Meeting, Learning, Idea, Task, Note, Document
- **Tag Management**: Flexible tagging system with quick tag suggestions

### Modern Interface

- **Clean Design System**: Consistent UI components with Tailwind CSS
- **Light/Dark Theme**: Elegant theme switching with proper color schemes
- **Responsive Layout**: Seamless experience across desktop and mobile
- **Smooth Animations**: Polished interactions and transitions

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router & TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design system
- **Database**: [Supabase](https://supabase.com/) for PostgreSQL backend
- **AI/Search**: [Groq](https://groq.com/) for language models + custom embeddings
- **UI Components**: Custom component library with shadcn/ui patterns
- **State Management**: React hooks with server-side integration

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Dashboard homepage
│   ├── memory/[id]/           # Individual memory view/edit
│   ├── new-memory/            # Memory creation form
│   ├── library/               # Memory library with search
│   ├── chat/                  # AI chat interface
│   ├── profile/               # User settings
│   └── api/                   # Backend API routes
│       ├── memories/          # Memory CRUD operations
│       ├── search/            # Search endpoints
│       ├── embeddings/        # AI embedding generation
│       ├── chat/             # AI chat endpoints
│       └── analytics/         # Usage analytics
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── search-bar.tsx
│   │   └── selection-group.tsx
│   ├── layout/                # Layout components
│   │   ├── PageLayout.tsx     # Consistent page wrapper
│   │   └── primitives.tsx     # Layout primitives
│   ├── shared/                # App-wide components
│   │   ├── MemoryCard.tsx
│   │   ├── SearchFilters.tsx
│   │   └── ViewControls.tsx
│   └── memory/                # Memory-specific components
├── lib/                       # Utilities and helpers
│   ├── memory-utils.tsx       # Memory type definitions
│   ├── search-utils.ts        # Search functionality
│   ├── groq.ts               # AI integration
│   └── agents/               # Chat agent logic
└── hooks/                     # Custom React hooks
    └── useEmbeddings.ts      # AI embedding hook
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account (for database)
- Groq API key (for AI features)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/cognote.git
   cd cognote
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Groq AI Configuration
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Set up Supabase database**

   - Create a new Supabase project
   - Run the SQL schema (see Database Setup section)
   - Enable Row Level Security if needed

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

Cognote uses Supabase (PostgreSQL) with the following schema:

```sql
-- Main memories table
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  embedding VECTOR(384), -- For AI search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_type ON memories(memory_type);
CREATE INDEX idx_memories_created_at ON memories(created_at);

-- Vector similarity search index
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);
```

## Design System

### Color Palette

```css
/* Light Theme */
--primary: #d99873; /* Terracotta */
--secondary: #a3b18a; /* Sage Green */
--accent: #78c6d0; /* Teal */
--muted: #f1f5f9; /* Light Gray */

/* Dark Theme */
--primary: #c49a7b; /* Muted Terracotta */
--secondary: #7a8a6b; /* Muted Sage */
--accent: #6bb6c1; /* Muted Teal */
--background: #212121; /* Clean Dark Gray */
```

### Memory Categories

Each memory type has distinct visual styling:

- **Research** - Teal accent
- **Product** - Terracotta accent
- **Meeting** - Sage accent
- **Learning** - Gold accent
- **Idea** - Peru accent
- **Task** - Slate accent
- **Note** - Sea Green accent
- **Document** - Forest Green accent

## API Routes

### Memory Management

- `POST /api/memories/create` - Create new memory
- `GET /api/memories/[id]` - Get memory by ID
- `PUT /api/memories/[id]` - Update memory
- `DELETE /api/memories/[id]` - Delete memory
- `POST /api/memories/search` - Search memories
- `GET /api/memories/tags` - Get all tags

### AI & Search

- `POST /api/embeddings` - Generate embeddings
- `POST /api/search` - Semantic search
- `POST /api/chat/unified` - AI chat responses

### Analytics

- `GET /api/analytics/memories` - Memory statistics

## Key Components

### Memory Creation (`/new-memory`)

- **2-column layout**: Content on left, metadata on right
- **Quick tags**: Pre-defined tags for rapid tagging
- **Category/type selection**: Dropdown selectors
- **AI embedding**: Automatic content analysis

### Memory Library (`/library`)

- **Advanced search**: Text search with filters
- **View modes**: Grid and list layouts
- **Smart filtering**: Category, type, tags, date range
- **Recent searches**: Quick access to previous queries

### AI Chat (`/chat`)

- **Unified interface**: Chat with AI about your memories
- **Context awareness**: AI understands your memory collection
- **Natural language**: Ask questions in plain English

### Memory Detail (`/memory/[id]`)

- **View/edit modes**: Seamless switching between viewing and editing
- **Consistent layout**: Matches new memory page design
- **Related memories**: AI-powered content suggestions

## Environment Configuration

```env
# Required - Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required - AI Features
GROQ_API_KEY=your_groq_api_key

# Optional - Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Workflow

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Component patterns**: Consistent naming and structure

### Component Architecture

- **Separation of concerns**: UI, logic, and data layers
- **Reusability**: Extract shared components appropriately
- **SOLID principles**: Single responsibility, open/closed, etc.
- **Clean abstractions**: Avoid over-engineering, focus on value

### Adding New Features

1. Create API route in `/api` if needed
2. Build UI components in appropriate `/components` folder
3. Add page in `/app` with proper layout
4. Test functionality and update types
5. Document any new environment variables

## Roadmap

### Immediate (v1.1)

- [ ] Advanced memory templates
- [ ] Bulk operations (delete, categorize)
- [ ] Memory sharing and collaboration
- [ ] Enhanced AI chat with memory references

### Short-term (v1.5)

- [ ] Memory linking and relationships
- [ ] File upload and attachment support
- [ ] Advanced analytics dashboard
- [ ] Import/export functionality

### Long-term (v2.0)

- [ ] Multi-user workspaces
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Integration with external tools (Notion, Obsidian)
- [ ] Advanced AI features (auto-categorization, summaries)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Update documentation for API changes
- Test your changes thoroughly

## Acknowledgments

- [Next.js](https://nextjs.org/) for the excellent React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Supabase](https://supabase.com/) for backend infrastructure
- [Groq](https://groq.com/) for lightning-fast AI inference
- [Lucide](https://lucide.dev/) for beautiful icons
