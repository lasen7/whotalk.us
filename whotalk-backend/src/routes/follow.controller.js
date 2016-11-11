import Account from './../models/account.js';
import Follow from './../models/follow.js';
import mongoose from 'mongoose';

/*
    FOLLOW
*/

export const follow = async (req, res) => {

    if (!req.user) {
        return res
            .status(401)
            .json({code: 0, message: 'NOT LOGGED IN'});
    }

    const followee = req.params.followee;
    const follower = req.user._id;

    if (followee === req.user.common_profile.username) {
        return res
            .status(400)
            .json({code: 1, message: 'YOU CANNOT FOLLOW YOURSELF'});
    }

    // check account

    let account = null;

    try {
        account = await Account.findUser(followee);
    } catch (error) {
        throw error;
    }

    if (!account) {
        return res
            .status(404)
            .json({code: 2, message: 'USER NOT FOUND'});
    }

    // get follow count
    const count = await Follow.getFollowerCount(account._id);

    // check whether the user is following already

    try {
        const follow = await Follow.checkFollow({
            followee: account._id,
            follower: mongoose
                .Types
                .ObjectId(follower)
        });

        if (follow) {
            // is following already
            return res.json({success: true, count});
        }
    } catch (error) {}

    try {
        await Follow.follow({
            followee: account._id,
            follower: mongoose
                .Types
                .ObjectId(follower)
        });
    } catch (error) {
        throw error;
    }

    res.json({
        success: true,
        count: count + 1
    });
}

export const unfollow = async (req, res) => {

    // check login

    if (!req.user) {
        return res
            .status(401)
            .json({code: 0, message: 'NOT LOGGED IN'});
    }

    const followee = req.params.followee;
    const follower = req.user._id;

    // check account

    let account = null;

    account = await Account.findUser(followee);

    if (!account) {
        return res
            .status(404)
            .json({code: 1, message: 'USER NOT FOUND'});
    }

    // check whether the user is following already

    const follow = await Follow.checkFollow({
        followee: account._id,
        follower: mongoose
            .Types
            .ObjectId(follower)
    });

    if (!follow) {
        // is not following already
        return res
            .status(404)
            .json({code: 1, message: 'YOU ARE NOT FOLLOWING THIS USER'});
    }

    const count = await Follow.getFollowerCount(account._id);

    await Follow.unfollow(follow._id);
    res.json({
        success: true,
        count: count - 1
    });
}

export const checkFollowing = async (req, res) => {}

export const getFollowers = async (req, res) => {

    const followee = req.params.followee;

    // query the account
    let account = null;

    account = await Account.findUser(followee);

    if (!account) {
        return res
            .status(404)
            .json({code: 0, message: 'USER NOT FOUND'});
    }

    let followers = await Follow.getFollowers(account._id);

    if(followers.length === 0) {
        return res.json({
            followers: []
        });
    }

    // let common;
    if(req.user) {
        const followerIds = followers.map(
            (follower) => {
                return follower.follower._id
            }
        );

        // common = await Follow.find({
        //     follower: mongoose.Types.ObjectId(req.user._id),
        //     followee: { $in: followerIds}
        // }, 'followee').exec();

        const common = await Follow.getCommonFollowers({
            userId: mongoose.Types.ObjectId(req.user._id),
            userIdArray: followerIds
        });

        

        if(common.length !== 0) {
            for (let i = 0 ; i < common.length; i++) {
                for(let j = 0 ; j < followers.length; j++) {
                    
                    if(common[i].followee.equals(followers[j].follower._id)) {
                        followers[j].following = true;
                    }
                }
            }
        }
    }

    res.json({followers});


}

export const getFollowersAfter = async (req, res) => {
    const followee = req.params.followee;
    const cursorId = req.params.cursorId;

    // CHECK MEMO ID VALIDITY
    if (!mongoose.Types.ObjectId.isValid(cursorId)) {
        return res
            .status(400)
            .json({error: "INVALID ID", code: 0});
    }

    // query the account
    let account = null;

    account = await Account.findUser(followee);

    if (!account) {
        return res
            .status(404)
            .json({code: 1, message: 'USER NOT FOUND'});
    }

    const followers = await Follow.getFollowersAfter({
        followee: account._id,
        cursorId: mongoose
            .Types
            .ObjectId(cursorId)
    });


    if(followers.length === 0) {
        return res.json({
            followers: []
        });
    }

    // if logged in
    if(req.user) {
        const followerIds = followers.map(
            (follower) => {
                return follower.follower._id
            }
        );

        // common = await Follow.find({
        //     follower: mongoose.Types.ObjectId(req.user._id),
        //     followee: { $in: followerIds}
        // }, 'followee').exec();

        const common = await Follow.getCommonFollowers({
            userId: mongoose.Types.ObjectId(req.user._id),
            userIdArray: followerIds
        });

        

        if(common.length !== 0) {
            for (let i = 0 ; i < common.length; i++) {
                for(let j = 0 ; j < followers.length; j++) {
                    if(common[i].followee.equals(followers[j].follower._id)) {
                        followers[j].following = true;
                    }
                }
            }
        }
    }

    res.json({followers})
}

/* get following */

export const getFollowing = async (req, res) => {

    const username = req.params.username;

    // query the account
    let account = null;

    account = await Account.findUser(username);

    if (!account) {
        return res
            .status(404)
            .json({code: 0, message: 'USER NOT FOUND'});
    }

    const following = await Follow.getFollowing(account._id);

    if(following.length === 0) {
        return {
            following: []
        };
    }

    // if logged in
    if(req.user) {
        const followingIds = following.map(
            (following) => {
                return following.followee._id
            }
        );


        const common = await Follow.getCommonFollowers({
            userId: mongoose.Types.ObjectId(req.user._id),
            userIdArray: followingIds
        });


        if(common.length !== 0) {
            for (let i = 0 ; i < common.length; i++) {
                for(let j = 0 ; j < following.length; j++) {
                    if(common[i].followee.equals(following[j].followee._id)) {
                        following[j].following = true;
                    }
                }
            }
        }
    }

    res.json({following});

}

export const getFollowingAfter = async (req, res) => {
    const username = req.params.username;
    const cursorId = req.params.cursorId;

    // CHECK MongoDB ID VALIDITY
    if (!mongoose.Types.ObjectId.isValid(cursorId)) {
        return res
            .status(400)
            .json({error: "INVALID ID", code: 0});
    }

    // query the account
    const account = await Account.findUser(username);

    if (!account) {
        return res
            .status(404)
            .json({code: 1, message: 'USER NOT FOUND'});
    }

    const following = await Follow.getFollowingAfter({
        follower: account._id,
        cursorId: mongoose
            .Types
            .ObjectId(cursorId)
    });

    // if logged in
    if(req.user) {
        const followingIds = following.map(
            (following) => {
                return following.followee._id
            }
        );


        const common = await Follow.getCommonFollowers({
            userId: mongoose.Types.ObjectId(req.user._id),
            userIdArray: followingIds
        });


        if(common.length !== 0) {
            for (let i = 0 ; i < common.length; i++) {
                for(let j = 0 ; j < following.length; j++) {
                    if(common[i].followee.equals(following[j].followee._id)) {
                        following[j].following = true;
                    }
                }
            }
        }
    }
    
    res.json({following});
}