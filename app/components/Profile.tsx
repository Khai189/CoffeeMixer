import {useReducer} from "react";

type Action = { type: "increment" } | { type: "decrement" };

export default function Profile() {
    const [state, dispatch] = useReducer((state: number, action: Action) => {
        switch (action.type) {
            case "increment":
                return state + 1;
            case "decrement":
                return state - 1;
            default:
                throw new Error("Unknown action type");
        }
    }, 0);

    return (
        <div className="flex flex-col items-center justify-center pt-16 pb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                This is your profile page!
            </h1>
            <div className="mt-4">
                <p className="text-xl text-gray-600 dark:text-gray-400">Counter: {state}</p>
                <button
                    onClick={() => dispatch({ type: "increment" })}
                    className="px-4 py-2 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                    Increment
                </button>
                <button
                    onClick={() => dispatch({ type: "decrement" })}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Decrement
                </button>
            </div>
        </div>
    );
}