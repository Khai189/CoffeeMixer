import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const recipes = [
  {
    name: "Honey Oat Latte",
    description:
      "A smooth and creamy latte with a touch of honey and oat milk. Perfect for a cozy morning.",
    brewMethod: "Espresso",
    difficulty: "easy",
    ingredients: ["Espresso", "Oat Milk", "Honey", "Cinnamon"],
    instructions:
      "1. Pull a double espresso shot.\n2. Heat oat milk and froth until creamy.\n3. Pour espresso into a mug, add a tablespoon of honey and stir.\n4. Pour frothed oat milk over the espresso.\n5. Sprinkle cinnamon on top and enjoy.",
  },
  {
    name: "Iced Vanilla Cold Brew",
    description:
      "Cold brewed for 18 hours with a hint of vanilla. Refreshing and bold.",
    brewMethod: "Cold Brew",
    difficulty: "easy",
    ingredients: ["Coarse Ground Coffee", "Cold Water", "Vanilla Syrup", "Ice"],
    instructions:
      "1. Combine coarse ground coffee and cold water in a jar (1:8 ratio).\n2. Stir gently and refrigerate for 16–18 hours.\n3. Strain through a fine mesh filter.\n4. Fill a glass with ice, pour cold brew to ¾ full.\n5. Add vanilla syrup to taste and stir.",
  },
  {
    name: "Caramel Macchiato",
    description:
      "Layered espresso with steamed milk, vanilla, and caramel drizzle. A classic crowd-pleaser.",
    brewMethod: "Espresso",
    difficulty: "medium",
    ingredients: ["Espresso", "Whole Milk", "Vanilla Syrup", "Caramel Sauce"],
    instructions:
      "1. Add vanilla syrup to the bottom of a mug.\n2. Steam whole milk until velvety.\n3. Pour steamed milk into the mug.\n4. Slowly pour a double espresso over the milk to create layers.\n5. Drizzle caramel sauce on top in a crosshatch pattern.",
  },
  {
    name: "French Press Dark Roast",
    description:
      "Full-bodied and rich. A no-frills brew that lets the beans speak for themselves.",
    brewMethod: "French Press",
    difficulty: "easy",
    ingredients: ["Dark Roast Beans", "Hot Water"],
    instructions:
      "1. Grind dark roast beans to a coarse consistency.\n2. Add grounds to French press (1:15 ratio with water).\n3. Pour water just off the boil (200°F) over grounds.\n4. Stir gently and place the lid on without pressing.\n5. Steep for 4 minutes, then press slowly and serve.",
  },
  {
    name: "Lavender Oat Cappuccino",
    description:
      "Floral and creamy with a perfect foam top. An artisan café experience at home.",
    brewMethod: "Espresso",
    difficulty: "hard",
    ingredients: ["Espresso", "Oat Milk", "Lavender Syrup", "Dried Lavender"],
    instructions:
      "1. Make lavender syrup: simmer 1 cup water, 1 cup sugar, and 2 tbsp dried lavender for 10 min, strain.\n2. Pull a double espresso.\n3. Add 1 tbsp lavender syrup to the espresso.\n4. Froth oat milk to a thick microfoam.\n5. Pour foam over espresso in a circular motion.\n6. Garnish with a pinch of dried lavender.",
  },
  {
    name: "Mocha AeroPress",
    description:
      "AeroPress brewed coffee mixed with rich chocolate. Quick, clean, and indulgent.",
    brewMethod: "AeroPress",
    difficulty: "medium",
    ingredients: [
      "Medium Roast Beans",
      "Hot Water",
      "Chocolate Syrup",
      "Steamed Milk",
    ],
    instructions:
      "1. Grind medium roast beans to a fine consistency.\n2. Set up AeroPress with a paper filter, add grounds.\n3. Pour hot water (185°F) and stir for 10 seconds.\n4. Press slowly over 30 seconds into a mug.\n5. Add chocolate syrup and stir.\n6. Top with steamed milk.",
  },
  {
    name: "Coconut Iced Latte",
    description:
      "Tropical vibes meet espresso. Creamy coconut milk over iced espresso for summer days.",
    brewMethod: "Espresso",
    difficulty: "easy",
    ingredients: ["Espresso", "Coconut Milk", "Ice", "Simple Syrup"],
    instructions:
      "1. Pull a double espresso and let it cool slightly.\n2. Fill a tall glass with ice.\n3. Pour coconut milk to ¾ full.\n4. Add simple syrup to taste.\n5. Slowly pour espresso over the back of a spoon to layer.",
  },
  {
    name: "Spiced Turkish Coffee",
    description:
      "An aromatic, thick brew with cardamom and cinnamon. Traditional and intense.",
    brewMethod: "Moka Pot",
    difficulty: "hard",
    ingredients: [
      "Extra Fine Coffee",
      "Water",
      "Cardamom Pods",
      "Cinnamon Stick",
      "Sugar",
    ],
    instructions:
      "1. Add water to a cezve (or small pot).\n2. Add extra fine ground coffee and sugar to taste.\n3. Crush 2 cardamom pods and add along with a cinnamon stick.\n4. Heat on low, stirring gently until it begins to foam.\n5. Remove from heat just before boiling, let foam settle.\n6. Repeat the foam process twice more.\n7. Pour slowly into a cup, grounds and all.",
  },
  {
    name: "Matcha Espresso Fusion",
    description:
      "The best of both worlds — earthy matcha meets bold espresso in a creamy layered drink.",
    brewMethod: "Espresso",
    difficulty: "medium",
    ingredients: ["Espresso", "Matcha Powder", "Oat Milk", "Honey"],
    instructions:
      "1. Whisk 1 tsp matcha with 2 tbsp hot water until smooth.\n2. Heat and froth oat milk.\n3. Pour matcha into a glass, add honey and stir.\n4. Add frothed oat milk.\n5. Pull a double espresso and pour gently on top to layer.",
  },
  {
    name: "Maple Pecan Pour Over",
    description:
      "A nutty, autumn-inspired pour over with real maple syrup. Clean and comforting.",
    brewMethod: "Pour Over",
    difficulty: "medium",
    ingredients: [
      "Medium-Light Roast Beans",
      "Hot Water",
      "Maple Syrup",
      "Pecan Milk",
    ],
    instructions:
      "1. Grind beans to a medium consistency.\n2. Place filter in dripper, rinse with hot water.\n3. Add grounds and bloom with a small pour for 30 seconds.\n4. Continue pouring in slow circles for 3–4 minutes.\n5. Add maple syrup to the brewed coffee and stir.\n6. Top with a splash of pecan milk.",
  },
  {
    name: "Nitro Cold Brew",
    description:
      "Ultra-smooth, nitrogen-infused cold brew. Rich, velvety, and sweet without any dairy or sugar.",
    brewMethod: "Cold Brew",
    difficulty: "medium",
    ingredients: ["Coarse Ground Coffee", "Filtered Water", "Nitrogen Cartridge"],
    instructions:
      "1. Brew cold brew concentrate by steeping coarse grounds in water for 24 hours.\n2. Strain completely through a fine mesh.\n3. Transfer to a whipped cream dispenser.\n4. Charge with a nitrogen cartridge and shake vigorously.\n5. Dispense into a chilled glass and admire the cascade.",
  },
  {
    name: "Classic Affogato",
    description:
      "A classic Italian dessert coffee. Hot, bold espresso poured over freezing cold vanilla bean ice cream.",
    brewMethod: "Espresso",
    difficulty: "easy",
    ingredients: ["Espresso", "Vanilla Bean Ice Cream"],
    instructions:
      "1. Scoop a generous amount of vanilla ice cream into a small bowl or glass.\n2. Pull a fresh double shot of espresso.\n3. Immediately pour the hot espresso over the ice cream.\n4. Serve right away with a spoon.",
  },
  {
    name: "Iced Shaken Espresso",
    description:
      "Robust espresso shaken with ice and lightly sweetened, topped with a refreshing splash of milk.",
    brewMethod: "Espresso",
    difficulty: "easy",
    ingredients: ["Espresso", "Classic Syrup", "Ice", "Whole Milk"],
    instructions:
      "1. Pull a double espresso shot.\n2. Add espresso, ice, and syrup to a cocktail shaker.\n3. Shake vigorously for 15 seconds until thoroughly chilled and frothy.\n4. Strain into a glass filled with fresh ice.\n5. Top with a splash of milk.",
  },
  {
    name: "Cardamom Pour Over",
    description:
      "A delicate and fragrant pour over infused with the warm spice of freshly ground cardamom.",
    brewMethod: "Pour Over",
    difficulty: "medium",
    ingredients: ["Light Roast Beans", "Cardamom Seeds", "Hot Water"],
    instructions:
      "1. Grind light roast coffee beans with a pinch of cardamom seeds to a medium-fine consistency.\n2. Rinse the paper filter with hot water.\n3. Add the ground mixture and pour 50g of water to bloom for 30 seconds.\n4. Slowly pour the remaining water in concentric circles.\n5. Let it finish dripping and serve.",
  },
  {
    name: "Dalgona Whipped Coffee",
    description:
      "Thick, velvety whipped coffee foam sitting atop chilled milk. A visually stunning and sweet treat.",
    brewMethod: "Espresso",
    difficulty: "medium",
    ingredients: ["Instant Coffee", "Granulated Sugar", "Hot Water", "Cold Milk", "Ice"],
    instructions:
      "1. Combine equal parts instant coffee, sugar, and hot water in a bowl.\n2. Whisk vigorously for 3-5 minutes until thick, golden peaks form.\n3. Fill a glass with ice and cold milk.\n4. Spoon the whipped coffee mixture on top of the milk.\n5. Stir well before drinking.",
  }
];

async function main() {
  console.log("Seeding database...");

  // Create recipes
  for (const recipe of recipes) {
    await prisma.recipe.create({ data: recipe });
  }

  console.log(`Seeded ${recipes.length} recipes successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
