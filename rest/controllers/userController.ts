import { Request, Response } from "express";
import { verifyToken } from "../../lib/firebaseAdmin";
import { Message, Prisma, User } from "@prisma/client";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { prismaClient } from "../../lib/prismaClient";
import { generateErrorObj } from "../../lib/generateErrorObj";
import {
  CustomRequest,
  ResponseHeader,
  QArgs,
  QArgsAndPage,
  ErrorObject,
} from "../../types/rest.types";
import {
  genErrorObj,
  sendError,
  parseFields,
  genResponseHeader,
  genLinksHeader,
  genQArgsAndPage,
} from "../../lib/utilities";

/**
 * Get user profile detail
 * @param req
 * @param res
 */
async function getUserDetail(req: CustomRequest, res: Response): Promise<void> {
  const id: string = req.params.userId;

  // the fields used to select of query
  const fields: QArgs["select"] = parseFields(req.query.fields);

  // get model of the user by user id
  try {
    const user: Partial<User> | null | void =
      await prismaClient.user.findUnique({
        where: { id },
        select: fields,
      });

    // throw an error if user is null
    if (!user) {
      res.status(404).json(genErrorObj(404, "The user is not found."));
      return;
    }

    // response the user
    res.status(200).json({ user });
  } catch (e) {
    sendError(res, e);
  }
}

async function getUserMessages(req: Request, res: Response): Promise<void> {
  // the type for query argument
  const { args, page }: QArgsAndPage<Prisma.MessageFindManyArgs> =
    genQArgsAndPage(req.query);

  // the userId is searched to extract messages
  const userId: User["id"] = req.params.userId;

  args.where = { userId };

  try {
    // extract messages
    const messages: Partial<Message>[] = await prismaClient.message.findMany(
      args
    );

    // extract total records
    const count: number = await prismaClient.message.count({
      where: { userId },
    });

    // generate info of  the result
    const header: ResponseHeader = genResponseHeader(count, args.take);

    // generate pagination
    const links: ReturnType<typeof genLinksHeader> = genLinksHeader(
      page,
      header["x-total-page-count"],
      req.url
    );

    // response
    res.status(200).set(header).links(links).json({ messages });
  } catch (e) {
    sendError(res, e);
  }
}

async function getUsers(req: Request, res: Response): Promise<void> {
  // generate args for query and page
  const { args, page }: QArgsAndPage<Prisma.UserFindManyArgs> = genQArgsAndPage(
    req.query
  );

  try {
    // get all users
    const users: Partial<User>[] = await prismaClient.user.findMany(args);

    // total count of users
    const count: number = await prismaClient.user.count();

    // generate info of  the result
    const header: ResponseHeader = genResponseHeader(count, args.take);

    // generate pagination
    const links: ReturnType<typeof genLinksHeader> = genLinksHeader(
      page,
      header["x-total-page-count"],
      req.url
    );

    // response all user data
    res.status(200).json({ users: users });
  } catch (e) {
    sendError(res, e);
  }
}

async function createUser(req: CustomRequest, res: Response): Promise<void> {
  const currentUser:CustomRequest["currentUser"] = req.currentUser!

  // get firebase token from body
  const firebaseToken: string = req.body.firebaseToken;

  // Only Admin is allowed to create a user
  if(!currentUser.isAdmin){
    const error = genErrorObj(403,'Not allowed to create a user.')
    res.status(error.code).json(error)
    return;
  }

  try {
    // get firebase user from firebase
    const currentUser: DecodedIdToken | ErrorObject = await verifyToken(
      firebaseToken
    );

    // throw an error if currentUser has an errorCode property
    if ("code" in currentUser) {
      // if the token were not authorized, it response error
      res.status(currentUser.code).json(currentUser);
      return;
    }

    if ("uid" in currentUser) {
      // create user
      const createdUser: User = await prismaClient.user.create({
        data: {
          firebaseId: currentUser.uid,
          username: currentUser.name,
        },
      });

      // response created user data
      res.status(200).json({ user: createdUser });

      return;
    }
  } catch (e) {
    console.error(e);

    res
      .status(404)
      .json({ errorObj: generateErrorObj(404, "Couldn't create a user") });
  }
}

async function editUser(req: CustomRequest, res: Response): Promise<void> {
  const currentUser: CustomRequest["currentUser"] = req.currentUser!;

  // the fields used to select of query
  const select: QArgs["select"] = parseFields(req.query.fields);

  const id: Prisma.UserWhereUniqueInput["id"] = req.params.userId;
  const data: Prisma.UserUpdateInput = req.body;

  // if the user who sent request is not admin, it would confirm params.userId
  if (!currentUser.isAdmin || id !== currentUser.id) {
    const error = genErrorObj(403, "Not allowed to edit the user");
    console.error(error);
    res.status(error.code).json(error);
    return;
  }

  try {
    const editedUser: Partial<User> = await prismaClient.user.update({
      where: { id },
      data,
      select,
    });

    if (!editedUser) {
      const error = genErrorObj(404, "The User is not Found");
      console.error(error);
      res.status(error.code).json(error);
      return;
    }

    res.status(200).json({ user: editedUser });
  } catch (e) {
    sendError(res, e);
  }
}

async function deleteUser(req: CustomRequest, res: Response): Promise<void> {
  let id: string | undefined = req.currentUser?.id;

  // if the user who sent request is admin it would confirm params.userId
  if (req.currentUser?.isAdmin) {
    id = req.params.userId || req.currentUser?.id;
  }

  const select: QArgs["select"] = parseFields(req.query.fields);

  try {
    const deletedUser: Partial<User> = await prismaClient.user.delete({
      where: { id },
      select,
    });

    res.status(200).json({ user: deletedUser });
  } catch (e) {
    sendError(res, e);
  }
}

const userController: {
  getUsers: any;
  getUserDetail: any;
  getUserMessages: any;
  createUser: any;
  editUser: any;
  deleteUser: any;
} = {
  getUsers,
  getUserDetail,
  getUserMessages,
  createUser,
  editUser,
  deleteUser,
};

export default userController;
