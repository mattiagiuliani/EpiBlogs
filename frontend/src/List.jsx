import AuthorList from "./AuthorList.jsx";
import PostList from "./PostList.jsx";

const List = ({ currentUser, onPostsChanged, refreshToken }) => {
  return (
    <div className="glass-card app-panel">
      <PostList
        currentUser={currentUser}
        onPostsChanged={onPostsChanged}
        refreshToken={refreshToken}
      />
      <hr className="divider" />
      <AuthorList />
    </div>
  );
};

export default List;
