import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import CollectionModal from "./CollectionModal";
import ConfirmModal from "./ConfirmModal";
import usePromptLibraryStore from "../../store/promptLibraryStore";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const CollectionCard = ({ collection, onOpen, onRename, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="collection-card">
      <div
        className="collection-card-main"
        onClick={onOpen}
        role="button"
        tabIndex={0}
      >
        <span className="collection-card-name">{collection.name}</span>
        <span className="collection-card-count">
          {collection.promptCount} {collection.promptCount === 1 ? "prompt" : "prompts"}
        </span>
      </div>

      <div className="prompt-card-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="prompt-card-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Collection options"
        >
          •••
        </button>

        {menuOpen && (
          <div className="prompt-card-menu">
            <button
              type="button"
              className="prompt-card-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onRename();
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="prompt-card-menu-item prompt-card-menu-item-danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Collections = () => {
  const navigate = useNavigate();
  const {
    collections,
    collectionsLoading,
    collectionsError,
    fetchCollections,
    createCollection,
    renameCollection,
    deleteCollection,
  } = usePromptLibraryStore();

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchCollections();

  }, []);

  const showEmpty = !collectionsLoading && !collectionsError && collections.length === 0;

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
            <h1 className="dashboard-title">Collections</h1>
            <p className="dashboard-subtitle">Group your prompts however you work.</p>
          </div>

          <div className="library-header-actions">
            <Button variant="ghost" onClick={() => navigate("/prompts")}>
              Back to Prompts
            </Button>
            <Button variant="amber" onClick={() => setModal({ mode: "create" })}>
              + New Collection
            </Button>
          </div>
        </motion.div>

        {collectionsLoading && (
          <div className="collections-grid">
            {[...Array(4)].map((_, i) => (
              <div className="collection-card collection-card-skeleton" key={i} />
            ))}
          </div>
        )}

        {!collectionsLoading && collectionsError && (
          <div className="empty-state">
            <p className="empty-state-title">Unable to load collections.</p>
            <Button variant="amber" onClick={fetchCollections}>
              Try Again
            </Button>
          </div>
        )}

        {showEmpty && (
          <div className="empty-state">
            <h2 className="empty-state-title">No collections yet.</h2>
            <p className="empty-state-description">
              Create a collection to start grouping your prompts.
            </p>
            <Button variant="amber" onClick={() => setModal({ mode: "create" })}>
              + New Collection
            </Button>
          </div>
        )}

        {!collectionsLoading && !collectionsError && collections.length > 0 && (
          <div className="collections-grid">
            {collections.map((collection) => (
              <CollectionCard
                key={collection._id}
                collection={collection}
                onOpen={() => navigate(`/prompts/collections/${collection._id}`)}
                onRename={() => setModal({ mode: "rename", collection })}
                onDelete={() => setDeleteTarget(collection)}
              />
            ))}
          </div>
        )}
      </Container>

      {modal && (
        <CollectionModal
          mode={modal.mode}
          initialName={modal.collection?.name || ""}
          onCancel={() => setModal(null)}
          onSubmit={async (name) => {
            if (modal.mode === "create") {
              await createCollection(name);
            } else {
              await renameCollection(modal.collection._id, name);
            }
            setModal(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          description='This will remove the collection but will NOT delete the prompts inside it. They will become unassigned.'
          confirmLabel="Delete Collection"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteCollection(deleteTarget._id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default Collections;
