import { Card } from "react-bootstrap";
import AuthorList from "./AuthorList.jsx";
import PostList from "./PostList.jsx";

const List = ({ refreshToken }) => {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <PostList refreshToken={refreshToken} />
        <hr className="my-4" />
        <AuthorList />
      </Card.Body>
    </Card>
  );
};

export default List;
