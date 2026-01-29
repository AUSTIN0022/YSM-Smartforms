import { IUserRepository } from "../repositories/user.repo";
import { hashPassword, comparePassword } from "../utils/password";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
import { SignupInput, LoginInput } from "../validators/auth.schema";

// dtos
import { SignupResponseDTO } from "../dtos/auth/signup.dto";
import { LoginResponseDTO } from "../dtos/auth/login.dto";
// mappper
import { toUserResponseDTO } from "../mappers/user.mapper";

// error handle
import { ConflictError, UnauthorizedError, NotFoundError } from "../errors/http-errors";
import { UserResponseDTO } from "../dtos/user/user-response.dto";

export class AuthService {

    constructor(private userRepositor: IUserRepository) {}

    // Signup
    async signup(data: SignupInput): Promise<SignupResponseDTO> {
        
        const existingUser = await this.userRepositor.findByEmail(data.email);
        if(existingUser){
            throw new ConflictError("User already exists");
        }
        
        const passwordHash = await hashPassword(data.password);

        const user = await this.userRepositor.createUser({
            name: data.name,
            email: data.email,
            passwordHash
        });

        return {
            user: toUserResponseDTO(user),
            accessToken: createAccessToken({ userId: user.id }),
            refreshToken: createRefreshToken({ userId: user.id })
        }
    }

    async login(data: LoginInput): Promise<LoginResponseDTO> {

        const user = await this.userRepositor.findByEmail(data.email);
        if(!user) {
            throw new NotFoundError("User not founds");
        }

        const isMatch = await comparePassword(data.password, user.passwordHash);
        if(!isMatch) {
            throw new UnauthorizedError("Invalid credentials");
        }

        return {
            user: toUserResponseDTO(user),
            accessToken: createAccessToken({ userId: user.id }),
            refreshToken: createRefreshToken({ userId: user.id })
        }
    }

    async getMe(userId: string): Promise<UserResponseDTO> {
        const user = await this.userRepositor.findById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        return toUserResponseDTO(user);
    }


    async logout(): Promise<{ message: string }> {
        return { message: "Logged out successfully" };
    }

}
