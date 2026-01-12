import React, { useState, useEffect } from "react";

interface GifPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

export function GifPicker({ isOpen, onClose, onSelect }: GifPickerProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial load of trending gifs or empty
    useEffect(() => {
        if (isOpen && !query) {
            fetchTrending();
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        if (!query) return;
        const timer = setTimeout(() => {
            searchGifs(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchTrending = async () => {
        setLoading(true);
        try {
            // Using the same key as found in index.tsx
            const res = await fetch(
                `https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=12`,
            );
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error("Failed to fetch trending GIFs", e);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `https://g.tenor.com/v1/search?q=${q}&key=LIVDSRZULELA&limit=12`,
            );
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error("Failed to search GIFs", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                zIndex: 1000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#222",
                    padding: "20px",
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "600px",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    color: "white",
                    border: "1px solid #444",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                    <h5 style={{ margin: 0, color: "#fff" }}>Select a GIF</h5>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#aaa",
                            fontSize: "20px",
                            cursor: "pointer",
                            padding: "0 10px",
                        }}
                    >
                        &times;
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: "100%",
                        marginBottom: "15px",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #444",
                        backgroundColor: "#333",
                        color: "white",
                    }}
                    autoFocus
                />

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: "10px",
                        paddingRight: "5px",
                    }}
                >
                    {loading && <div style={{ color: "#888", textAlign: "center", gridColumn: "1/-1" }}>Loading...</div>}
                    {!loading && results.map((gif) => (
                        <div
                            key={gif.id}
                            onClick={() => onSelect(gif.media?.[0]?.gif?.url)}
                            style={{
                                cursor: "pointer",
                                borderRadius: "4px",
                                overflow: "hidden",
                                height: "100px",
                                backgroundColor: "#000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                src={gif.media?.[0]?.tinygif?.url}
                                alt={gif.content_description}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
