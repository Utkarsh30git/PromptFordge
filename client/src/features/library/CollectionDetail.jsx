import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    prompts,
    promptsLoading,
    promptsError,
    collections,
    search,
    fetchPrompts,
    fetchCollections,
    setSearch,
    setActiveCollectionId,
    toggleFavorite,
    moveToCollection,
    createPrompt,
    deletePrompt,
  } = usePromptLibraryStore();

  const [searchInput, setSearchInput] = useState("");
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchCollections();
    setSearch("");
    setActiveCollectionId(id);
    setSearchInput("");

    return () => setActiveCollectionId(null);

  }, [id]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setSearch(value), 300);
  };

  const handleNewPrompt = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const prompt = await createPrompt(id);
      navigate(`/prompts/${prompt._id}`);
    } catch {

    } finally {
      setCreating(false);
    }
  };

  const collection = collections.find((c) => c._id === id);

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
            <h1 className="dashboard-title">{collection?.name || "Collection"}</h1>
            <p className="dashboard-subtitle">
              {collection ? `${collection.promptCount} prompts` : "\u00A0"}
            </p>
          </div>

          <div className="library-header-actions">
            <Button variant="ghost" onClick={() => navigate("/prompts/collections")}>
              Back to Collections
            </Button>
            <Button variant="amber" onClick={handleNewPrompt} disabled={creating}>
              {creating ? "Creating…" : "+ Add Prompt"}
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
        </motion.div>

        {promptsLoading && (
          <div className="library-grid">
            {[...Array(3)].map((_, i) => (
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
            <h2 className="empty-state-title">
              This collection doesn't have any prompts yet.
            </h2>
            <Button variant="amber" onClick={handleNewPrompt} disabled={creating}>
              Add Prompt
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
                onDelete={deletePrompt}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default CollectionDetail;
