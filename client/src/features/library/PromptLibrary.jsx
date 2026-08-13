import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import PromptCard from "./PromptCard";
import usePromptLibraryStore from "../../store/promptLibraryStore";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "recent", label: "Recent" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "name_asc", label: "Name A-Z" },
  { id: "name_desc", label: "Name Z-A" },
];

const PromptLibrary = () => {
  const navigate = useNavigate();
  const {
    prompts,
    promptsLoading,
    promptsError,
    collections,
    search,
    filter,
    sort,
    fetchPrompts,
    fetchCollections,
    setSearch,
    setFilter,
    setSort,
    toggleFavorite,
    moveToCollection,
    createPrompt,
  } = usePromptLibraryStore();

  const [searchInput, setSearchInput] = useState(search);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchCollections();
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearch(value);
    }, 300);
  };

  const handleNewPrompt = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const prompt = await createPrompt(null);
      navigate(`/prompts/${prompt._id}`);
    } catch {
      // best-effort — a toast/error surface can be added later if needed
    } finally {
      setCreating(false);
    }
  };

  const showEmptyNoPrompts =
    !promptsLoading && !promptsError && prompts.length === 0 && !search;
  const showEmptyNoResults =
    !promptsLoading && !promptsError && prompts.length === 0 && Boolean(search);

  return (
    <div className="library-page">
      <Container>
        <motion.div
          className="library-header"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div>
            <p className="dashboard-kicker mono">PROMPTFORGE LIBRARY</p>
            <h1 className="dashboard-title">Prompts</h1>
            <p className="dashboard-subtitle">
              Manage, organize and reuse your prompts.
            </p>
          </div>

          <div className="library-header-actions">
            <Button variant="ghost" onClick={() => navigate("/prompts/collections")}>
              Collections
            </Button>
            <Button variant="amber" onClick={handleNewPrompt} disabled={creating}>
              {creating ? "Creating…" : "+ New Prompt"}
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="library-controls"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
        >
          <input
            className="library-search"
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search prompts..."
          />

          <div className="library-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`settings-tab ${filter === f.id ? "active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            className="library-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          {promptsLoading && (
            <div className="library-grid">
              {[...Array(6)].map((_, i) => (
                <div className="prompt-card prompt-card-skeleton" key={i} />
              ))}
            </div>
          )}

          {!promptsLoading && promptsError && (
            <div className="empty-state">
              <p className="empty-state-title">Unable to load prompts.</p>
              <Button variant="amber" onClick={fetchPrompts}>
                Try Again
              </Button>
            </div>
          )}

          {showEmptyNoPrompts && (
            <div className="empty-state">
              <p className="empty-state-kicker mono">Empty library</p>
              <h2 className="empty-state-title">No prompts yet.</h2>
              <p className="empty-state-description">
                Create your first prompt and start building your library.
              </p>
              <Button variant="amber" onClick={handleNewPrompt} disabled={creating}>
                Create Prompt
              </Button>
            </div>
          )}

          {showEmptyNoResults && (
            <div className="empty-state">
              <h2 className="empty-state-title">No prompts found.</h2>
              <p className="empty-state-description">Try a different search.</p>
            </div>
          )}

          {!promptsLoading && !promptsError && prompts.length > 0 && (
            <div className="library-grid">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt._id}
                  prompt={prompt}
                  collections={collections}
                  onToggleFavorite={toggleFavorite}
                  onMove={moveToCollection}
                />
              ))}
            </div>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default PromptLibrary;
