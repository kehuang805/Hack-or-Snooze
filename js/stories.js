"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories(); // instantiates StoryList class
  let favoriteIds = currentUser.favorites.map( val => val.storyId);
  // Changes favorite attribute of each story in storyList that is in favorites to true when user loaded
  for (let story of storyList.stories) { 
    if (favoriteIds.indexOf(story.storyId) >= 0) {
      story.favorite = true;
    }
  }
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let favorited = '<i class="fas fa-star"></i>';
  let notFavorited = `<i class="far fa-star favorite"></i>`
  let star;
  star = story.favorite ? favorited : notFavorited;
  console.log(star);
  console.log(`story.favorite: ${story.favorite}`);


  return $(`
      <li id="${story.storyId}">
        ${star}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Creates new story when form is submitted. generates its HTML, and puts on page */

async function putNewStoryOnPage(evt) {
  evt.preventDefault();
  let storyInfo = {}; // Object to send into addStory method that contains info sent in post request
  storyInfo.author = $("#author").val();
  storyInfo.title = $("#title").val();
  storyInfo.url = $("#url").val();
  let newStoryObject = await storyList.addStory(currentUser, storyInfo); // need to await bc addStory is async
  let newStory = generateStoryMarkup(newStoryObject);
  $allStoriesList.prepend(newStory);
  storyList.unshift(newStoryObject);
}

$storyForm.on("submit", putNewStoryOnPage);