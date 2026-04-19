import { useEffect, useMemo, useState } from "react";
import { getAuthorById, updateAuthor, uploadAuthorAvatar } from "./assets/api.js";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const toDateInputValue = (birthDate) => {
  if (!birthDate) return "";

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const buildInitialForm = (author) => ({
  profile: typeof author?.profile === "string" ? author.profile : "",
  birthDate: toDateInputValue(author?.birthDate),
  avatar: typeof author?.avatar === "string" ? author.avatar : "",
});

const getInitials = (author) => {
  const first = author?.firstName?.[0] ?? "";
  const last = author?.lastName?.[0] ?? "";
  return `${first}${last}`.trim() || "AU";
};

const ProfilePage = ({ currentUser, onLogout, onNavigate, onProfileUpdated }) => {
  const [author, setAuthor] = useState(null);
  const [formValues, setFormValues] = useState({ profile: "", birthDate: "", avatar: "" });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAuthor = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAuthorById(currentUser._id);
        if (!isMounted) return;
        setAuthor(data);
        setFormValues(buildInitialForm(data));
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAuthor();

    return () => {
      isMounted = false;
    };
  }, [currentUser._id]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [selectedAvatarFile]);

  const displayedAvatar = avatarPreviewUrl || formValues.avatar;

  const hasPendingChanges = useMemo(() => {
    if (!author) return false;

    return (
      formValues.profile !== (author.profile ?? "")
      || formValues.birthDate !== toDateInputValue(author.birthDate)
      || formValues.avatar !== (author.avatar ?? "")
      || Boolean(selectedAvatarFile)
    );
  }, [author, formValues, selectedAvatarFile]);

  const handleFieldChange = ({ target }) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }));
  };

  const handleAvatarSelection = ({ target }) => {
    const file = target.files?.[0] ?? null;

    if (!file) {
      target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedAvatarFile(null);
      setSuccessMessage("");
      setError("Avatar must be an image file.");
      target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setSelectedAvatarFile(null);
      setSuccessMessage("");
      setError("Avatar image must be 5MB or smaller.");
      target.value = "";
      return;
    }

    setSelectedAvatarFile(file);
    setSuccessMessage("");
    setError("");
    target.value = "";
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatarFile(null);
    setFormValues((currentValues) => ({
      ...currentValues,
      avatar: "",
    }));
    setSuccessMessage("");
    setError("");
  };

  const handleReset = () => {
    setSelectedAvatarFile(null);
    setError("");
    setSuccessMessage("");
    setFormValues(buildInitialForm(author));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setUploading(false);
    setError("");
    setSuccessMessage("");

    try {
      let uploadedAuthor = null;

      if (selectedAvatarFile) {
        setUploading(true);
        uploadedAuthor = await uploadAuthorAvatar(currentUser._id, selectedAvatarFile);
        setUploading(false);
      }

      const payload = {
        profile: formValues.profile,
        birthDate: formValues.birthDate ? `${formValues.birthDate}T00:00:00.000Z` : null,
      };

      if (!selectedAvatarFile && formValues.avatar !== (author?.avatar ?? "")) {
        payload.avatar = formValues.avatar;
      }

      const updatedAuthor = await updateAuthor(currentUser._id, payload);
      const mergedAuthor = uploadedAuthor?.avatar
        ? { ...updatedAuthor, avatar: uploadedAuthor.avatar }
        : updatedAuthor;

      setAuthor(mergedAuthor);
      setFormValues(buildInitialForm(mergedAuthor));
      setSelectedAvatarFile(null);
      onProfileUpdated?.(mergedAuthor);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="hero-row">
        <div className="glass-card hero-panel animate-in">
          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow">Account</span>
              <h1 className="hero-title">Your Profile</h1>
              <p className="hero-copy mb-0">
                Manage the public author details attached to your account without changing your login identity.
              </p>
            </div>
            <div className="account-badge">
              <div>
                <strong>{author ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim() || currentUser.email : currentUser.email}</strong>
                <small>{currentUser.email}</small>
              </div>
              <div className="account-actions">
                <button className="btn btn-ghost" onClick={() => onNavigate("/")} type="button">
                  Back to dashboard
                </button>
                <button className="btn btn-outline" onClick={onLogout} type="button">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card section-state" role="status">
          <div className="spinner-sm" aria-label="Loading profile" />
          <span>Loading your profile...</span>
        </div>
      ) : error && !author ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : (
        <div className="profile-grid animate-in">
          <aside className="profile-sidebar">
            <div className="profile-avatar-shell">
              <div className="profile-avatar" aria-label="Profile avatar preview">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt={`${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() || currentUser.email} />
                ) : (
                  <span>{getInitials(author)}</span>
                )}
              </div>

              <div className="profile-avatar-actions">
                <label className="btn btn-primary" htmlFor="profile-avatar-input">
                  Choose image
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelection}
                  hidden
                />
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={!formValues.avatar && !selectedAvatarFile}
                >
                  Remove image
                </button>
              </div>
            </div>

            <div className="profile-meta">
              <div className="profile-identity">
                <h2 className="profile-name">{`${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() || "Authenticated author"}</h2>
                <p className="profile-email">{currentUser.email}</p>
              </div>
              <p className="profile-hint">
                The email address is read-only. Local and Google sessions share the same profile update flow.
              </p>
              {selectedAvatarFile ? (
                <div className="alert alert-info" role="status">
                  Selected image: {selectedAvatarFile.name}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="profile-editor">
            <div className="section-header">
              <div>
                <span className="eyebrow">Public Details</span>
                <h2 className="section-title mt-2 mb-1">Author settings</h2>
                <p className="section-copy mb-0">
                  Update the bio and birth date shown in the editorial interface.
                </p>
              </div>
            </div>

            {error ? (
              <div className="alert alert-danger" role="alert">{error}</div>
            ) : null}
            {successMessage ? (
              <div className="alert alert-success" role="status">{successMessage}</div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">Email</label>
                <input id="profile-email" className="form-control" value={currentUser.email} readOnly />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-bio">Description</label>
                <textarea
                  id="profile-bio"
                  className="form-control"
                  name="profile"
                  value={formValues.profile}
                  onChange={handleFieldChange}
                  placeholder="Tell readers who you are and what you write about."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-birthDate">Birth date</label>
                <input
                  id="profile-birthDate"
                  className="form-control"
                  type="date"
                  name="birthDate"
                  min="1930-01-01"
                  max={new Date().toISOString().slice(0, 10)}
                  value={formValues.birthDate}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="profile-actions">
                <p className="profile-note">
                  {uploading ? "Uploading avatar..." : "Changes are applied only to your own author record."}
                </p>
                <div className="profile-actions__group">
                  <button className="btn btn-ghost" type="button" onClick={handleReset} disabled={!hasPendingChanges || saving}>
                    Reset
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={!hasPendingChanges || saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;