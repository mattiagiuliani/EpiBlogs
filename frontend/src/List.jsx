import AuthorList from "./AuthorList.jsx";
import PostList from "./PostList.jsx";

const List = ({ currentUser, onPostsChanged, refreshToken, optimisticPost }) => {
  return (
    <div className="glass-card app-panel">
      <PostList
        currentUser={currentUser}
        onPostsChanged={onPostsChanged}
        refreshToken={refreshToken}
        optimisticPost={optimisticPost}
      />
      <hr className="divider" />
      <AuthorList />
    </div>
  );
};

export default List;
