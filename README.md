# CoffeeMixer ☕

**Your one-stop shop to finding your new favorite coffee drink!**

CoffeeMixer is a full-stack social media-style coffee recommendation app built with React Router v7, TypeScript, Prisma, and PostgreSQL. Share your coffee recipes, discover new brews, and get personalized recommendations based on your preferences.

---

## ✨ Features

### 🔐 **Authentication System**
- Secure user registration and login with session-based authentication
- Password hashing with bcrypt
- Protected routes and personalized experiences

### 🎨 **Mobile-First Responsive Design**
- Fully optimized for mobile devices with touch-friendly UI
- Responsive hamburger navigation menu
- Mobile-optimized typography and spacing
- Hidden scrollbars for cleaner mobile experience
- Minimum 44px touch targets for accessibility

### 🤖 **Smart Recommendation Engine**
- **Hybrid recommendation system** combining:
  - **Content-based filtering**: Matches recipes to your brew method, milk type, sweetness, and strength preferences
  - **Collaborative filtering**: Finds similar users and recommends recipes they love
  - **Popularity metrics**: Boosts trending recipes based on likes and saves
  - **Recency bonus**: Gives newer recipes a slight boost
- Personalized "For You" section on home page
- Trending recipes for non-logged-in users

### 📸 **Image Cropping & Upload**
- **Interactive image cropping** with react-easy-crop
- Crop images before posting to feed or creating recipes
- Live preview with zoom controls
- Re-crop option after initial crop
- Supports JPEG, PNG, WebP, and GIF formats (max 5MB)
- Images stored in `public/uploads/`

### 🏠 **Recipe Management**
- Create and share coffee recipes with ingredients, instructions, and images
- Filter recipes by brew method, difficulty, or popularity
- Like and save favorite recipes
- Detailed recipe pages with author information
- Difficulty ratings (Easy 🟢, Medium 🟡, Hard 🔴)

### 💬 **Social Feed**
- Post updates about what you're brewing
- Share photos of your coffee creations
- Delete your own posts
- Real-time timestamps ("just now", "2h ago", etc.)
- Empty state messages for better UX

### 👤 **User Profiles**
- Interactive coffee preference selector:
  - Brew method (Espresso, Pour Over, French Press, Cold Brew, etc.)
  - Milk type (None, Whole, Oat, Almond, Soy, etc.)
  - Sweetness level (Unsweetened → Very Sweet)
  - Strength (Mild → Extra Strong)
- View your created recipes
- Personalized dashboard

### ♿ **Accessibility Features**
- Semantic HTML with proper headings and landmarks
- ARIA labels and roles throughout
- Skip-to-content link for keyboard navigation
- Focus states on all interactive elements
- Screen reader-friendly alt text and descriptions

---

## 🛠️ Tech Stack

### **Frontend**
- **React Router v7** - File-based routing with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling with dark mode support
- **react-easy-crop** - Interactive image cropping

### **Backend**
- **Node.js** - Runtime environment
- **Prisma 7.2.4** - ORM with PostgreSQL adapter
- **PostgreSQL** - Database
- **bcrypt** - Password hashing

### **Build Tools**
- **Vite** - Fast build tool and dev server
- **TypeScript** - Compile-time type checking

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database running locally or remotely

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CoffeeMixer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # PostgreSQL connection URL (for migrations)
   DATABASE_URL="postgresql://username:password@localhost:5432/coffeemixer"
   
   # Direct database URL for Prisma Client
   DIRECT_DATABASE_URL="postgresql://username:password@localhost:5432/coffeemixer"
   
   # Session secret (generate a random string)
   SESSION_SECRET="your-super-secret-random-string-here"
   ```

4. **Set up the database**
   ```bash
   # Create the database
   createdb coffeemixer
   
   # Run migrations
   npx prisma migrate deploy
   
   # (Optional) Seed with sample data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to `http://localhost:5173`

---

## 🚀 Usage

### Creating Your Profile
1. Sign up for an account
2. Navigate to your profile
3. Set your coffee preferences (brew method, milk type, sweetness, strength)
4. Get personalized recipe recommendations!

### Creating a Recipe
1. Click "Create Recipe" from the dashboard
2. Fill in recipe details (name, description, ingredients, instructions)
3. Upload an image and crop it to perfection
4. Select brew method and difficulty
5. Publish and share with the community!

### Posting to Feed
1. Visit the Feed page
2. Write what you're brewing today
3. Add a photo and crop it
4. Post to share with everyone!

### Discovering Recipes
- Browse the home page for your personalized "For You" section
- Use filters to find recipes by brew method or difficulty
- Like and save recipes you want to try
- View detailed instructions and ingredients

---

## 📁 Project Structure

```
CoffeeMixer/
├── app/
│   ├── components/          # Reusable React components
│   │   ├── CoffeeCard.tsx
│   │   ├── ImageCropModal.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── lib/                 # Server-side utilities
│   │   ├── auth.server.ts
│   │   ├── db.server.ts
│   │   ├── recommendations.server.ts
│   │   └── session.server.ts
│   ├── routes/              # Page routes
│   │   ├── home.tsx
│   │   ├── feed.tsx
│   │   ├── new-recipe.tsx
│   │   ├── profile.tsx
│   │   └── ...
│   ├── app.css              # Global styles
│   ├── root.tsx             # App root with layout
│   └── routes.ts            # Route configuration
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── public/
│   └── uploads/             # User-uploaded images
├── package.json
└── README.md
```

---

## 🗃️ Database Schema

### **User**
- Email, password (hashed), name
- One-to-one relation with Profile
- One-to-many relations with Recipe, Post, Like, SavedRecipe

### **Profile**
- Coffee preferences: brewMethod, milkType, sweetnessLevel, strengthLevel
- Belongs to User

### **Recipe**
- Name, description, brewMethod, difficulty
- Ingredients (array), instructions, imageUrl
- Belongs to User (author)
- Related to Like and SavedRecipe

### **Post**
- Body text, imageUrl
- Belongs to User (author)

### **Like** & **SavedRecipe**
- Many-to-many relations between User and Recipe

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas for future enhancements:

- [ ] Add recipe ratings and reviews
- [ ] Implement recipe search with full-text search
- [ ] Add social following/followers system
- [ ] Integrate with coffee shop APIs for ingredient sourcing
- [ ] Add brew timer and measurement converters
- [ ] Implement recipe collections/playlists
- [ ] Add coffee bean recommendations
- [ ] Support for multiple photos per recipe
- [ ] Video upload support
- [ ] Recipe print view

---

## 📄 License

MIT License - feel free to use this project for learning or building your own coffee community!

---

## 🙏 Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- Styled with [Tailwind CSS v4](https://tailwindcss.com/)
- Database powered by [Prisma](https://www.prisma.io/) and PostgreSQL
- Image cropping by [react-easy-crop](https://github.com/ValentinH/react-easy-crop)

---

**Happy brewing! ☕**
