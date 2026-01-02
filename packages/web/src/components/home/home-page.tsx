import { useUser } from "@/hooks/user";
import { logOut } from "@overdrip/core/auth";

const HomePage = () => {
  const user = useUser();

  return (
    <button onClick={logOut} className="btn">
      Log out {user.uid}
    </button>
  );
};

export default HomePage;
