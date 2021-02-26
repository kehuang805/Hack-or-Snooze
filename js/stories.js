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
  console.debug("generateStoryMarkup", story);
  console.log(story instanceof Story);

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
  currentUser.ownStories.push(newStoryObject);  // Update front end ownStories array
  let newStory = generateStoryMarkup(newStoryObject);
  $allStoriesList.prepend(newStory);
  storyList.stories.unshift(newStoryObject);
  $storyForm.trigger("reset"); //Reset() does not work with jquery, stackoverflow: https://stackoverflow.com/questions/16452699/how-to-reset-a-form-using-jquery-with-reset-method
  $storyForm.hide();
}

$storyForm.on("submit", putNewStoryOnPage);

$storiesContainer.on("click", ".favorite", favoriteToggle);

/** Event handler for click on star icon. Invokes removeFavorite or addFavorite depending on favorite status of story */
function favoriteToggle(evt){
  const storyId = evt.target.closest("li").id;
  const story = getStory(storyId);
  if (!checkFavorite(story)) {
    currentUser.addFavorite(story);
    $(evt.target).removeClass('far');
    $(evt.target).addClass('fas');  //toggleClass
  } else {
    currentUser.removeFavorite(story);
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

/** Fills favorite page with user's favorites and shows favorite stories list */
function putFavoritesOnPage() {
  $favStoriesList.empty();
  let favorites = currentUser.favorites;
  for (let favorite of favorites) {
    favorite.favorite = true;
    putNewFavoriteOnPage(favorite);
  }

  $favStoriesList.show();
}

/** Fills my stories page with user's own stories and shows the list */
function putMyStoriesOnPage() {
  $myStoriesList.empty();
  const trashCan = '<i class="fas fa-trash-alt remove"></i>'
  let myStories = currentUser.ownStories;
  for (let story of myStories) {
    let markup = generateStoryMarkup(story);
    markup.closest("li").prepend(`${trashCan}`);
    $myStoriesList.append(markup);
  }
  $myStoriesList.show();
}

/** Removes own story from DOM and calls removeMyStory() to send delete request to API. Only called when trash icon is clicked on my stories page */
function removeMyStoryOnPage(evt) {
  const storyId = evt.target.closest("li").id;
  const story = getStory(storyId);
  currentUser.removeMyStory(story);
  $(evt.target.closest("li")).remove();
}


$storiesContainer.on("click", ".remove", removeMyStoryOnPage);
$storiesContainer.on("mouseover", ".remove", (evt) => {
  $(evt.target).css("color", "red");
})
$storiesContainer.on("mouseout", ".remove", (evt) => {
  $(evt.target).removeAttr("style");
})