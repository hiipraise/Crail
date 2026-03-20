import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/discovery/StoryCard";
import StoryCardSkeleton from "@/components/discovery/StoryCardSkeleton";
import StoryRow from "@/components/discovery/StoryRow";
import { storiesApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { StoryListItem } from "@/types";

function SectionEmptyState({ title, description, ctaLabel, ctaHref }: {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-cloudy-200 bg-white/70 px-6 py-10 text-center">
      <p className="font-serif text-lg text-foreground">{title}</p>
      <p className="mt-2 text-sm text-cloudy-400">{description}</p>
      <Link to={ctaHref} className="inline-flex mt-4">
        <Button variant="outline">{ctaLabel}</Button>
      </Link>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const [featured, setFeatured] = useState<StoryListItem[]>([]);
  const [trending, setTrending] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, trendRes] = await Promise.all([
          storiesApi.featured(),
          storiesApi.trending(),
        ]);
        setFeatured(featRes.data.items ?? []);
        setTrending(trendRes.data.items ?? []);
      } catch {
        // use empty arrays on error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero */}
      {!isAuthenticated && (
        <section className="px-4 pt-8 pb-10 text-center bg-gradient-to-b from-crail-50 to-pampas border-b border-cloudy-200">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
              Read. Write.
              <br />
              <span className="text-crail">Live stories.</span>
            </h1>
            <p className="text-cloudy-500 text-base mb-6 leading-relaxed">
              Discover long-form fiction written by passionate authors. Read
              like a real book, write with AI assistance.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/explore">
                <Button size="lg" className="gap-2">
                  Start reading <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">
                  Join free
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      {/* Welcome back */}
      {isAuthenticated && user && (
        <div className="px-4 pt-6 pb-2">
          <h2 className="font-serif text-2xl font-semibold">
            Welcome back,{" "}
            <span className="text-crail">{user.displayName.split(" ")[0]}</span>
          </h2>
          <p className="text-cloudy-500 text-sm mt-1">
            Continue where you left off
          </p>
        </div>
      )}

      {/* Featured */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-crail" />
            Featured
          </h2>
          <Link
            to="/explore?sort=featured"
            className="text-sm text-crail flex items-center gap-1"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <StoryCardSkeleton key={i} />
              ))
            : featured.length > 0
              ? featured.map((story, i) => (
                  <StoryCard key={story._id} story={story} index={i} />
                ))
              : null}
        </div>

        {!loading && featured.length === 0 && (
          <SectionEmptyState
            title="No featured stories yet"
            description="Featured picks will appear here once editors spotlight new reads."
            ctaLabel="Browse latest stories"
            ctaHref="/explore?sort=newest"
          />
        )}
      </section>

      {/* Trending */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-crail" />
            Trending Now
          </h2>
          <Link
            to="/explore?sort=trending"
            className="text-sm text-crail flex items-center gap-1"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-white border border-cloudy-200 shimmer"
                />
              ))
            : trending.length > 0
              ? trending
                  .slice(0, 5)
                  .map((story, i) => (
                    <StoryRow
                      key={story._id}
                      story={story}
                      index={i}
                      rank={i + 1}
                    />
                  ))
              : null}
        </div>

        {!loading && trending.length === 0 && (
          <SectionEmptyState
            title="Nothing is trending right now"
            description="Check back soon or explore freshly updated stories from the community."
            ctaLabel="Explore trending alternatives"
            ctaHref="/explore?sort=popular"
          />
        )}
      </section>
    </div>
  );
}
