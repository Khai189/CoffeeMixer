# CoffeeMixer ☕

**Your one-stop shop to finding your new favorite coffee drink!**

CoffeeMixer is a full-stack social media-style coffee recommendation app built with React Router v7, TypeScript, Prisma, and PostgreSQL. Share your coffee recipes, discover new brews, and get personalized recommendations based on your preferences.

---

## Features

### **Smart Recommendation Engine**
- **Hybrid recommendation system** combining:
  - **Content-based filtering**: Matches recipes to your brew method, milk type, sweetness, and strength preferences
  - **Collaborative filtering**: Finds similar users and recommends recipes they love
  - **Popularity metrics**: Boosts trending recipes based on likes and saves
  - **Recency bonus**: Gives newer recipes a slight boost
- Personalized "For You" section on home page
- Trending recipes for non-logged-in users

### **Recipe Management**
- Create and share coffee recipes with ingredients, instructions, and images
- Filter recipes by brew method, difficulty, or popularity
- Like and save favorite recipes
- Detailed recipe pages with author information
- Difficulty ratings (Easy 🟢, Medium 🟡, Hard 🔴)

### **Social Feed**
- Post updates about what you're brewing
- Share photos of your coffee creations
- Delete your own posts
- Real-time timestamps ("just now", "2h ago", etc.)

### **User Profiles**
- Interactive coffee preference selector:
  - Brew method (Espresso, Pour Over, French Press, Cold Brew, etc.)
  - Milk type (None, Whole, Oat, Almond, Soy, etc.)
  - Sweetness level (Unsweetened → Very Sweet)
  - Strength (Mild → Extra Strong)
- View your created recipes
- Personalized dashboard

### **Accessibility Features**
- Semantic HTML with proper headings and landmarks
- ARIA labels and roles throughout
- Skip-to-content link for keyboard navigation
- Focus states on all interactive elements
- Screen reader-friendly alt text and descriptions

---

## Tech Stack

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

## License

MIT License - feel free to use this project for learning or building your own coffee community!

---

## Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- Styled with [Tailwind CSS v4](https://tailwindcss.com/)
- Database powered by [Prisma](https://www.prisma.io/) and PostgreSQL
- Image cropping by [react-easy-crop](https://github.com/ValentinH/react-easy-crop)

---

**Happy brewing! ☕**
