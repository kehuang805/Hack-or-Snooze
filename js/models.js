"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt, favorite = false }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
    this.favorite = favorite;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    let index = this.url.indexOf("/")+2;
    let noHttp = this.url.slice(index)
    if (noHttp.indexOf("/") < 0) {
      return noHttp;
    } else {
      return noHttp.split("").splice(0, noHttp.indexOf("/")).join("");
    }
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    // UNIMPLEMENTED: complete this function!
    const response = await axios.post(`${BASE_URL}/stories`, {
      token: user.loginToken,
      story: {
        author: newStory.author,
        title: newStory.title,
        url: newStory.url
      }
    });
    return new Story(response.data.story);
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** Takes in story instance as argument, marks story as favorite, updates info through api*/
  async addFavorite(story) {
    story.favorite = true;
    let username = this.username;
    let storyId = story.storyId;
    let requestLink = `${BASE_URL}/users/${username}/favorites/${storyId}`;
    const response = await axios.post(requestLink, {token: this.loginToken});
    console.log(response);
    this.favorites.push(story);
  }

  async removeFavorite(story) {
    let username = this.username;
    let storyId = story.storyId;
    let requestLink = `${BASE_URL}/users/${username}/favorites/${storyId}`;
    const response = await axios.delete(requestLink, {data: {token: this.loginToken}});
    console.log(response);
    story.favorite = false;
    let removeIndex = this.getFavoriteRemoveIndex(story);
    this.favorites.splice(removeIndex, 1);
  }

  /** Helper function to get removal index of favorite */ //Can use findIndex
  getFavoriteRemoveIndex(story) {
    let favoriteIds = this.favorites.map(val => val.storyId);
    for (let index in favoriteIds) {
      if (favoriteIds[index] === story.storyId) {
        return index;
      }
    }
  }

  async removeMyStory(story) {
    let storyId = story.storyId;
    let requestLink = `${BASE_URL}/stories/${storyId}`;
    const response = await axios.delete(requestLink, {data: {token: this.loginToken}});
    console.log(response);
    let ownStoriesRemoveIndex = this.getMyStoriesRemoveIndex(story);
    this.ownStories.splice(ownStoriesRemoveIndex, 1);
    let storyListRemoveIndex = this.getStoryListRemoveIndex(story);
    storyList.stories.splice(storyListRemoveIndex, 1);
    story.favorite = false;
    let removeIndex = this.getFavoriteRemoveIndex(story);
    this.favorites.splice(removeIndex, 1);
    
  }

  getMyStoriesRemoveIndex(story) {
    let myStoryIds = this.ownStories.map(val => val.storyId);
    return myStoryIds.indexOf(story.storyId);
  }

  getStoryListRemoveIndex(story) {
    let storyIds = storyList.stories.map(val => val.storyId);
    return storyIds.indexOf(story.storyId);
  }
}
