# Personal blog
## To add stuff
### If you have node.js, follow these steps:
1. Navigate to post.txt. Here you will enter your work as follows:
    - First line: The section you want to post it to. For now, please just use 'feature' (write the exact word).
    - Second line: The title of your post. From here on the format is [key]: [value] to allow parsing to JSON so don't touch the keys. Just input the title.
    - Third line: The subtitle of your post. This is a short description providing the context (or anything you want to add here, really idc) for the post.
    - Fourth line: The link to your image (optional). If you have the image, I recommend putting it in the `imgs` folder and use the relative link.
    - Fifth line onwards: the content of your post. Just paste it in and JS will take care  of the rest.
2. In your terminal, run this command: `node txt_to_json.js`. The post will be automatically added to the correct JSON file and can be viewed locally with a simple Ctrl + Shift + R.
3. Create a pull request so I can add your post.

### If you don't have node.js:
You can add the post manually in the correct JSON file. Please verify that the formatting is correct. It is highly recommended that you use some kind of tool to add line breaks/newlines for your `content` field. Here's a way to do it in the browser:

```js
let myText = [insert your text here];
myText = JSON.stringify(myText);
// optional step to turn newlines into line breaks to make paragraphs look better
myText = myText.replaceAll("\n", "\n\n");
// optional step to remove indentation
myText = myText.replaceAll("\t", "");
// get the result from the console output
console.log(myText);
```