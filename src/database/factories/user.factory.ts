import { hash } from "bcryptjs";
import { setSeederFactory } from "typeorm-extension";
import { User } from "../entities/user.entity";

export const UserFactory = setSeederFactory(User, async () => {
    const user = new User();

    user.name = "Youms Vantablack";
    user.email = "youmsc@proton.me";
    user.password = await hash("password", 12);

    return user;
});