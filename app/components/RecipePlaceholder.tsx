const GRADIENT_PAIRS = [
    { from: "from-amber-300", to: "to-orange-600" },
    { from: "from-orange-200", to: "to-rose-500" },
    { from: "from-stone-300", to: "to-amber-700" },
    { from: "from-emerald-200", to: "to-teal-600" },
    { from: "from-sky-200", to: "to-indigo-500" },
    { from: "from-fuchsia-200", to: "to-purple-600" },
    { from: "from-yellow-200", to: "to-orange-500" },
    { from: "from-slate-300", to: "to-slate-700" },
    { from: "from-rose-200", to: "to-pink-600" },
    { from: "from-lime-200", to: "to-green-600" },
];

const GRADIENT_DIRECTIONS = [
    "bg-linear-to-br",
    "bg-linear-to-tr",
    "bg-linear-to-r",
    "bg-linear-to-b",
];

function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

interface RecipePlaceholderProps {
    recipeId: string;
    className?: string;
}

export default function RecipePlaceholder({
    recipeId,
    className = "",
}: RecipePlaceholderProps) {
    const hash = djb2(recipeId);
    const pair = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
    const direction =
        GRADIENT_DIRECTIONS[(hash >>> 4) % GRADIENT_DIRECTIONS.length];
    return (
        <div
            className={`${direction} ${pair.from} ${pair.to} ${className}`}
            aria-hidden="true"
        />
    );
}
