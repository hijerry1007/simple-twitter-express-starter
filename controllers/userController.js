// 引入資料庫
const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Reply = db.Reply
const moment = require('moment')
const Followship = db.Followship
const bcrypt = require('bcryptjs')

const fs = require('fs')

const userController = {
  getTweets: async (req, res) => {
    try {

      const userId = Number(req.params.id)
      let isOwner = userId === req.user.id ? true : false;

      const { dataValues } = await User.findByPk(userId) ? await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          Like,
          Tweet,
          Reply
        ]
      }) : null

      if (!dataValues) {
        throw new Error("user is not found");
      }
      let userData = {}
      userData = {
        ...dataValues, introduction: dataValues.introduction ? dataValues.introduction.substring(0, 30) : null,
        isFollowing: req.user.Followings.map(d => d.id).includes(userId)
      }

      const tweets = dataValues.Tweets.map(tweet => ({
        ...tweet,
        description: tweet.description
          ? tweet.description.substring(0, 50)
          : null,
        updatedAt: tweet.updatedAt
          ? moment(tweet.updatedAt).format(`YYYY-MM-DD, hh:mm`)
          : "-",
      }));

      return res.render('getTweets', { userData, tweets, isOwner })
    } catch (error) {
      console.log("error", error);
    }
  },
  getFollowings: async (req, res) => {
    try {

      const userId = Number(req.params.id)
      let isOwner = userId === req.user.id ? true : false;

      const { dataValues } = await User.findByPk(userId) ? await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          Like,
          Tweet,
          Reply
        ]
      }) : null

      if (!dataValues) {
        throw new Error("user is not found");
      }
      let userData = {}
      userData = {
        ...dataValues, introduction: dataValues.introduction ? dataValues.introduction.substring(0, 30) : null,
        isFollowing: req.user.Followings.map(d => d.id).includes(userId)
      }


      const followings = dataValues.Followings.map(following => ({
        ...following.dataValues,
        introduction: following.introduction ? following.introduction.substring(0, 20) : null,
      }))

      return res.render('getFollowings', { userData, followings: followings, isOwner })
    } catch (error) {
      console.log("error", error);
    }
  },
  getFollowers: async (req, res) => {
    try {

      const userId = Number(req.params.id)
      let isOwner = userId === req.user.id ? true : false;
      const { dataValues } = await User.findByPk(userId) ? await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          Like,
          Tweet,
          Reply
        ]
      }) : null

      if (!dataValues) {
        throw new Error("user is not found");
      }
      let userData = {}
      userData = {
        ...dataValues, introduction: dataValues.introduction ? dataValues.introduction.substring(0, 30) : null,
        isFollowing: req.user.Followings.map(d => d.id).includes(userId)
      }

      const followers = dataValues.Followers.map(follower => ({
        ...follower.dataValues,
        introduction: follower.introduction ? follower.introduction.substring(0, 20) : null,
        isOwnFollower: follower.dataValues.id === req.user.id ? true : false
      }))

      return res.render('getFollowers', { userData, followers: followers, isOwner })
    } catch (error) {
      console.log("error", error);
    }
  },
  getLikes: async (req, res) => {
    try {

      const userId = Number(req.params.id)
      let isOwner = userId === req.user.id ? true : false;
      const { dataValues } = await User.findByPk(userId) ? await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          Like,
          Tweet,
          Reply
        ]
      }) : null

      if (!dataValues) {
        throw new Error("user is not found");
      }
      let tweetsData = {}
      tweetsData = await Tweet.findAll({
        include: [
          User,
          Like,
          Reply
        ]
      })

      let userData = {}
      userData = { ...dataValues, introduction: dataValues.introduction ? dataValues.introduction.substring(0, 30) : null, isFollowing: req.user.Followings.map(d => d.id).includes(userId) }

      const likedTweets = tweetsData.filter(tweet =>
        userData.Likes.map(like => like.dataValues.TweetId).includes(tweet.dataValues.id)
      )

      const tweets = likedTweets.map(tweet => ({
        ...tweet,
        description: tweet.description
          ? tweet.description.substring(0, 50)
          : null,
        updatedAt: tweet.updatedAt
          ? moment(tweet.updatedAt).format(`YYYY-MM-DD, hh:mm`)
          : "-",
      }));

      return res.render('getLikes', { userData, tweets, isOwner })
    } catch (error) {
      console.log("error", error);
    }
  },
  addFollowing: async (req, res) => {
    try {
      const newFollow = await Followship.create({
        followerId: req.user.id,
        followingId: req.params.userId,
      });

      return res.redirect("back");
    } catch (error) {
      console.log("error", error);
    }
  },
  deleteFollowing: async (req, res) => {
    try {
      const destroyFollow = await Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: req.params.userId,
        },
      }).then((followship) => {
        followship.destroy()
      })
      return res.redirect('back')

    } catch (error) {
      console.log("error", error);
    }
  },
  getEdit: async (req, res) => {
    try {
      // let isOwn = userId === req.user.id ? true : false

      const userId = req.params.id;
      const { dataValues } = (await User.findByPk(userId))
        ? await User.findByPk(userId)
        : null;

      if (!dataValues) {
        throw new Error("user is not found");
      }
      let user = {};
      user = { ...dataValues };

      return res.render("getEdit", { user });
    } catch (error) {
      console.log("error", error);
    }
  },
  postEdit: async (req, res) => {
    try {
      // if (!req.body.name) {
      //   req.flash('error_messages', "請至少輸入姓名")
      //   return res.redirect('back')
      // }
      const userId = req.params.id;

      const { file } = req;
      if (file) {
        const data = fs.readFileSync(file.path);
        const writeFile = fs.writeFileSync(`upload/${file.originalname}`, data);

        const updateUser = await User.findByPk(userId).then((user) => {
          user.update({
            name: req.body.name,
            introduction: req.body.introduction,
            avatar: file ? `/upload/${file.originalname}` : null,
          });
        });

        // 可以加flash - 更新成功

        return res.redirect(`/users/${userId}/edit`);
      } else {
        const updateUser = await User.findByPk(userId).then((user) => {
          user.update({
            name: req.body.name,
            introduction: req.body.introduction,
            avatar: this.avatar,
          });
        });

        return res.redirect(`/users/${userId}/tweets`);
      }
    } catch (error) {
      console.log("error", error);
    }
  },
  signUpPage: (req, res) => {
    return res.render("signup");
  },

  signUp: (req, res) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
      req.flash("error_messages", "兩次密碼輸入不同！");
      return res.redirect("/signup");
    } else {
      // confirm unique user
      User.findOne({ where: { email: req.body.email } }).then((user) => {
        if (user) {
          req.flash("error_messages", "信箱重複！");
          return res.redirect("/signup");
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(
              req.body.password,
              bcrypt.genSaltSync(10),
              null
            ),
          }).then((user) => {
            req.flash("success_messages", "成功註冊帳號！");
            return res.redirect("/signin");
          });
        }
      });
    }
  },

  signInPage: (req, res) => {
    return res.render("signin");
  },

  signIn: (req, res) => {
    req.flash("success_messages", "成功登入！");
    res.redirect("/tweets");
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  }
}

module.exports = userController;
