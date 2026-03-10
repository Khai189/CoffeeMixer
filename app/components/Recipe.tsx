import {useState, useEffect} from 'react';

interface RecipeType {
    id: string;
    name: string;
    ingredients: string[];
    instructions: string;
}

export default function Recipe({ id }: { id: string }) {
    const [recipe, setRecipe] = useState<RecipeType | null>(null);

    useEffect(() => {
        // Simulate fetching recipe details based on ID
        setTimeout(() => {
            setRecipe({
                id,
                name: `Coffee Recipe ${id}`,
                ingredients: ["Coffee Beans", "Water", "Milk"],
                instructions: "Brew coffee and mix with milk."
            });
        }, 500);
    }, [id]);

    if (!recipe) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{recipe.name}</h1>
            <h2 className="text-xl font-semibold mb-2">Ingredients:</h2>
            <ul className="list-disc list-inside mb-4">
                {recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                ))}
            </ul>
            <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
            <p>{recipe.instructions}</p>
        </div>
    );
}
