import { Request, Response, NextFunction } from "express";
import { APIError } from "../errors/api-error";
import { v4 } from "uuid";
import bcrypt from "bcrypt";
import { Enviroment } from "../../config/enviroment-vars";
import User from "../models/schemas/user";
import { AuthService } from "../services/auth.service";
import { Constants } from "../../common/constants";
import { StatusCodes } from "http-status-codes";
import { BadRequest } from "../errors/server-errors";

export const signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    AuthService.validateParams(username, password);
    await AuthService.userExits(username);

    const salt = bcrypt.genSaltSync(Enviroment.SALT_ROUNDS);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = {
      userId: v4(),
      username,
      password: hashedPassword
    };

    const userModel = await User.create(newUser);
    await userModel.save();

    const response = AuthService.getResponse(newUser.userId, username);

    res.status(200).json(response);
  } catch (error) {
    next(new APIError(error?.message, error?.status));
  }
}

export const signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    AuthService.validateParams(username, password);

    const user = await User.findOne({ username }).select({ userId: 1, username: 1, password: 1 });

    if (!user) {
      throw new APIError(Constants.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    AuthService.validatePassword(password, user.password);

    const response = AuthService.getResponse(user.userId, username);

    res.status(200).json(response);
  } catch (error) {
    next(new APIError(error?.message, error?.status));
  }
}

export const getAccountDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization;
    const user = await AuthService.getUserByToken(token);

    const user_ = {
      username: user.username,
      userId: user.userId,
    };

    res.status(200).json(user_);
  } catch (error) {
    next(new APIError(error?.message, error?.status));
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization;
    const user = await AuthService.getUserByToken(token);

    const { oldPassword, newPassword, confirmPassword } = req.body;

    AuthService.validatePasswordParams(oldPassword, newPassword, confirmPassword);
    AuthService.validatePassword(oldPassword, user.password);

    if (newPassword != confirmPassword) {
      throw new BadRequest(Constants.PASSWORDS_DOESNT_MATCH);
    }

    const passwordMatch = bcrypt.compareSync(newPassword, user.password);

    if (passwordMatch) {
      throw new BadRequest(Constants.NEW_PASSWORD_AND_OLD_PASSWORD_ARE_THE_SAME);
    }

    const salt = bcrypt.genSaltSync(Enviroment.SALT_ROUNDS);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.status(200).json({ message: Constants.PASSWORD_CHANGED_SUCCESSFULLY });
  } catch (error) {
    next(new APIError(error?.message, error?.status));
  }
}

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization;
    const user = await AuthService.getUserByToken(token);

    const { password } = req.body;

    if (!password) {
      throw new BadRequest(Constants.ALL_FIELDS_ARE_REQUIRED);
    }

    AuthService.validatePassword(password, user.password);

    await User.findByIdAndDelete(user._id);

    res.status(200).json({ message: Constants.ACCOUNT_DELETED_SUCCESSFULLY });
  } catch (error) {
    next(new APIError(error?.message, error?.status));
  }
}
