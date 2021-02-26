"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;


/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories(); // instantiates StoryList class
  let favoriteIds = currentUser.favorites.map( val => val.storyId);
  // Changes favorite attribute of each story in storyList that is in favorites to true when user loaded
  for (let story of storyList.stories) { 
    console.log("In getAndShowStoriesOnStart, story: ", story);
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
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const favorited = '<i class="fas fa-star favorite"></i>';
  const notFavorited = '<i class="far fa-star favorite"></i>'
  let star;
  star = story.favorite ? favorited : notFavorited;

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
  $favStoriesList.empty();

  let favoriteIds = currentUser.favorites.map( val => val.storyId);

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    console.log("In putStoriesOnPage, story: ", story);
    const $story = generateStoryMarkup(story);
    console.log("After generateStoryMarkup: ", story);
    console.log("JSON object: ", $story);
    $allStoriesList.append($story);

    if (favoriteIds.indexOf(story.storyId) >= 0) {
      $favStoriesList.append($story.clone()); // Reference : https://stackoverflow.com/questions/25939472/jquery-appending-an-object-multiple-times
    }

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

$storiesContainer.on("click", ".favorite", favoriteToggle);

/** Event handler for click on star icon. Invokes removeFavorite or addFavorite depending on favorite status of story */
function favoriteToggle(evt){
  console.log(evt.target);
  const storyId = evt.target.closest("li").id;
  console.log(storyId);
  const $story = getStory(storyId);
  console.log($story);
  if (!checkFavorite($story)) {
    currentUser.addFavorite($story);
    $(evt.target).removeClass('far');
    $(evt.target).addClass('fas');
  } else {
    currentUser.removeFavorite($story);
    $(evt.target).removeClass('fas');
    $(evt.target).addClass('far');
  }
}

/** Retrieves story object from storyList using storyId. Only used in event handler functions */
function getStory(id){
  for (let story of storyList.stories) {
    if (story.storyId === id) {
      return story;
    }
  }
  
}

/** Returns boolean favorite attribute of story object*/
function checkFavorite(story) {
  return story.favorite;
}

/** Adds new favorite on favorite list and changes star icon*/
function putNewFavoriteOnPage(story) {
  $favStoriesList.prepend(generateStoryMarkup(story));
}

/** Removes favorite from favorite list and changes star icon*/
function removeFavoriteOnPage(story) {
  let id = story.storyId;
  $(`#${id}`).remove();
}

//NEED TO FIX FAVORITE LIST NOT HAVING ALL PAST FAVORITES