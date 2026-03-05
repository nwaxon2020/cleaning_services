import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const apiKey = process.env.NEWS_API;

  if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

  const categoryQueries: Record<string, string> = {
    all: "Boston Lincolnshire UK",
    transportation: "Boston Lincolnshire UK transport traffic",
    sports: "Boston United FC sports",
    government: "Boston Borough Council Lincolnshire",
    cleaning: "UK environment hygiene waste",
  };

  const query = encodeURIComponent(categoryQueries[category]);

  try {
    // 1. Try fetching specific Boston News
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${apiKey}`
    );
    const data = await response.json();
    let articles = data.articles || [];

    // 2. Fallback: If less than 8 articles, fetch general UK Top Headlines
    if (articles.length < 8) {
      const fallbackRes = await fetch(
        `https://newsapi.org/v2/top-headlines?country=gb&pageSize=${8 - articles.length}&apiKey=${apiKey}`
      );
      const fallbackData = await fallbackRes.json();
      articles = [...articles, ...(fallbackData.articles || [])];
    }

    const formatted = articles.slice(0, 8).map((a: any, i: number) => ({
      id: `news-${i}`,
      title: a.title,
      description: a.description?.slice(0, 80) + "...",
      url: a.url,
      source: a.source.name,
      image: a.urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}