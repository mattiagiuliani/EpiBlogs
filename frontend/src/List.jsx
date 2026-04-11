import AuthorList from "./AuthorList.jsx";
import PostList from "./PostList.jsx";

const List = ({ refreshToken }) => {
  return (
    <div className="glass-card app-panel">
      <PostList refreshToken={refreshToken} />
      <hr className="divider" />
      <AuthorList />
    </div>
  );
};

export default List;
