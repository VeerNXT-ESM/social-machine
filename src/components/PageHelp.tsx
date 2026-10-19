import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { NavTab } from './Sidebar';
import { Card, CardHeader } from './ui';

interface HelpSection {
  title: string;
  intro: string;
  items: { term: string; text: string }[];
}

/**
 * Plain-language explanations shown at the bottom of each page, for someone seeing the app for the first time.
 * Keep these short and honest about anything that is still a preview.
 */
const HELP: Record<string, HelpSection> = {
  dashboard: {
    title: 'The dashboard',
    intro: 'A quick picture of where all your posts stand. Nothing here changes anything; it is for looking and for jumping to the right place.',
    items: [
      { term: 'The five counters', text: 'Count your content by stage: Drafts (just started), In review (written, waiting for a decision), Approved (agreed and ready to be scheduled), Scheduled (given a date and time), Published (sent out).' },
      { term: 'Recent content', text: 'Each card is one piece of content, such as an article turned into posts for LinkedIn, X, Instagram and Facebook. Click a card to open it and read or edit the posts.' },
      { term: 'Create content / View calendar', text: 'The two buttons at the top start a new piece of content, or show everything laid out by date.' },
      { term: 'Sandbox mode', text: 'Shown at the top of every page. It means "Published" is a rehearsal: no post is sent to a real LinkedIn, X, Instagram or Facebook account yet.' },
    ],
  },
  create: {
    title: 'Creating content',
    intro: 'You give the app some source material, and it writes a draft for each social channel you choose, plus a matching image. The drafts always wait for your review.',
    items: [
      { term: 'Article, Link, Notes, Idea', text: 'Pick the kind of material you are starting from. They all lead to the same place: write or paste what you have into the large box.' },
      { term: 'Website URL and "Fetch page"', text: 'Paste the address of an article and press Fetch page. The app reads the page and fills in the title and text for you. Social media addresses cannot be read.' },
      { term: 'Source material', text: 'The facts the posts will be built from. The AI is told to use only what is written here, so better material gives better posts.' },
      { term: 'Details on the right', text: 'Campaign is the group the post belongs to. Content type describes its purpose. Call to action is the closing line that points readers to VeerNXT. Additional instructions let you steer the tone or angle.' },
      { term: 'Channels', text: 'Tick the platforms you want posts for. Each gets its own wording, because each platform reads differently.' },
      { term: 'Image (optional)', text: 'Upload your own picture (PNG, JPEG or WebP, up to 10 MB) and it is used on every channel, and no AI image is created. If you read an article from its web address, its own picture is offered with a button to use it. Leave it empty and the app makes an image for you.' },
      { term: 'Generate', text: 'Creates the drafts and one image. It takes about half a minute and costs a few rupees of AI credit. When it finishes, you land on the editor.' },
    ],
  },
  content: {
    title: 'The content library',
    intro: 'Every piece of content that has been created, in one list. Use it to find something, check its stage, or approve several at once.',
    items: [
      { term: 'Search and filters', text: 'Type in the search box, or narrow the list by stage (status) or by channel.' },
      { term: 'Columns', text: 'Content shows the title and campaign. Channels shows where it will go. Status shows the stage. "Posts approved" shows how many of its posts have been approved (for example 3 of 4).' },
      { term: 'Open an item', text: 'Click any row to open it in the editor.' },
      { term: 'Delete content', text: 'Tick the boxes and press "Delete" to remove content and all its channel posts for good (you are asked to confirm). Posts waiting in Buffer are cancelled there first. Posts already published stay on LinkedIn or X; only the app copy is removed. You can also delete from inside an item.' },
      { term: 'Approve several at once', text: 'Tick the boxes on the left of the rows, then press "Approve posts". Posts that are already scheduled or published are left alone.' },
    ],
  },
  editor: {
    title: 'The editor',
    intro: 'Where you read, improve and approve the posts for one piece of content. Each channel has its own tab because the wording differs.',
    items: [
      { term: 'Core message and Visual concept', text: 'The main idea the posts are based on, and a description of the image that goes with them.' },
      { term: 'Channel tabs', text: 'Switch between LinkedIn, X, Instagram and Facebook. The small word next to each name is that post\'s stage.' },
      { term: 'Editor and Preview', text: 'Editor lets you change the wording. Preview shows roughly how the post will look on that platform. Your edits save automatically; look for "Saved" above the text box.' },
      { term: 'Image', text: 'Shows the picture that goes with the post. "Upload your own" replaces it with a picture from your computer; "Choose from library" reuses one you uploaded before; "Remove" takes it off. Leave "Use this image on all channels" ticked to change every channel at once, or untick it to change only the channel you are on.' },
      { term: 'AI refinements', text: 'One-click rewrites of the current post only: make it shorter, longer, change the opening line, or make it more professional or more conversational.' },
      { term: 'Approve', text: '"Approve" agrees the post for the channel you are on. "Approve all channels" does every channel at once.' },
      { term: 'Schedule post / Publish now', text: 'Schedule picks a date and time. Publish now sends it immediately. Both need the post to be approved, and in sandbox mode they are a rehearsal only.' },
      { term: 'Manual publishing', text: 'Copy the text, download the image, open the platform in a new tab, post it yourself, then press "Mark as published".' },
    ],
  },
  calendar: {
    title: 'The calendar',
    intro: 'Shows every post that has a date, so you can see what is going out and when, and the busy and quiet days.',
    items: [
      { term: 'Week, Month, List', text: 'Choose how to view it. Week shows each day in a column, Month shows the whole month, List shows a simple table in date order. Use the arrows and "Today" to move around.' },
      { term: 'The small boxes', text: 'Each box is one post: channel icon, time, and the content title. A tick means it has gone out; a clock means it is waiting. Click a box to open the post.' },
      { term: 'Channel buttons and status filter', text: 'The four icons at the top switch channels on and off. The drop-down shows only scheduled or only published posts.' },
      { term: 'Ready to schedule', text: 'The panel on the right lists approved posts that have no date yet. Press Schedule, choose a date and time, then Confirm, and the post appears on the calendar.' },
      { term: 'Times', text: 'Times are shown in the timezone of the computer you are using.' },
    ],
  },
  sources: {
    title: 'Sources',
    intro: 'Finds articles on defence and strategy websites that could inspire posts. The app keeps only the link, the title and a short excerpt, never the whole article.',
    items: [
      { term: 'The list on the left', text: 'The websites being watched. Tick or untick the box to include or skip a site. "Scan" checks one site now; "Remove" stops watching it. "Add source" lets you add another website, and tests it first.' },
      { term: 'Scan all sources', text: 'Visits each ticked site, politely and one at a time, and adds any new articles it finds. It takes around fifteen seconds. Obvious spam is thrown away automatically.' },
      { term: 'New, Saved, Used, Dismissed', text: 'The stage of each link. New is unseen. Save keeps one for later. Dismiss hides one you do not want. Used means posts have already been made from it.' },
      { term: 'Defence-related only', text: 'On by default. It hides links that have nothing to do with defence, such as the general-interest filler some sites publish.' },
      { term: 'Relevance number', text: 'A simple score of how closely a headline relates to veterans and defence, with the matching words listed beside it. Higher means closer. It is a guide, not a verdict, so use your own judgement.' },
      { term: 'Create content', text: 'Opens the Create page with the article\'s title and full text already filled in, and instructions to credit the source and write in new words.' },
      { term: '"Contains a restricted term"', text: 'A warning that the article uses a word our brand rules do not allow in posts. You can still use the article, but the wording must not be repeated.' },
    ],
  },
  media: {
    title: 'The media library',
    intro: 'Every image stored for your posts, in one place: pictures you upload and images the app created for you.',
    items: [
      { term: 'Upload images', text: 'Press the button, or drag pictures onto the dashed box. You can add several at once. PNG, JPEG and WebP files up to 10 MB are accepted; other kinds of file are refused. Every picture is automatically converted to a smaller WebP (at most 2048 pixels wide or tall) so posts load quickly.' },
      { term: 'Each picture', text: 'Shows its name, whether you uploaded it or the app created it, its size and the date. Uploaded pictures can be reused on any post from the editor using "Choose from library".' },
      { term: 'Delete', text: 'Removes a picture permanently after you confirm. A picture that a post still uses cannot be deleted; the page tells you how many posts use it, so change those posts first.' },
    ],
  },
  campaigns: {
    title: 'Campaigns',
    intro: 'A campaign is a group of content built around one theme, such as a product launch or a series on skills.',
    items: [
      { term: 'The cards', text: "Each card shows a campaign's name, its stage (Active, Planned or Completed) and how many content items belong to it." },
      { term: 'How a campaign is created', text: 'Type a campaign name in the Details box when you create content. If the name is new, the campaign is created and appears here. Nothing on this page is sample data.' },
    ],
  },
  analytics: {
    title: 'Analytics',
    intro: 'How your published posts performed, read from Buffer.',
    items: [
      { term: 'Real figures only', text: 'Everything on this page comes from Buffer. Nothing is estimated. A dash means the platform has not reported that figure; platforms usually report a few hours after a post goes out.' },
      { term: 'The counts at the top', text: 'Published is the number of posts Buffer has sent. Scheduled, Approved and In review are counted from the posts in this app.' },
      { term: 'Impressions, likes, comments, shares, clicks, saves', text: 'Impressions are the number of times a post was shown. The others count the different ways people reacted to it. A tile appears only once a platform has reported it.' },
      { term: 'By channel and Published posts', text: 'The same figures split by platform and by post, with a link to open each post. Press Refresh to read the latest.' },
    ],
  },
  settings: {
    title: 'Settings',
    intro: 'Controls how the app publishes and how posts should sound.',
    items: [
      { term: 'Publishing mode', text: 'Sandbox runs everything as a rehearsal. Manual publishing means you copy each post and post it yourself. Buffer really publishes to LinkedIn and X (the same as switching to Live at the top). Facebook and Instagram are not connected yet. The app always opens in Sandbox.' },
      { term: 'Brand voice', text: 'The brand name, a short description, who you are speaking to, the tone, preferred words and key messages. The AI follows these every time it writes or rewrites a post. Change them and press Save; the new voice applies to posts created afterwards (existing posts are not rewritten).' },
      { term: 'Prohibited words', text: 'Words and ideas that must never appear in posts. "Agniveer" is always on this list and comes back if you remove it. Every post is checked against the list: if the AI uses one of these words it rewrites the post, the editor shows a warning if you type one, and a post containing one cannot be scheduled or published. Other rules, such as never inventing facts, are fixed and cannot be changed here.' },
      { term: 'Saved for everyone', text: 'The brand voice is stored on the server, so everyone who signs in uses the same one, on any computer.' },
    ],
  },
};

interface PageHelpProps {
  tab: NavTab;
  /** True when a piece of content is open in the editor (the "content" tab shows the editor instead of the library). */
  editing?: boolean;
}

export function PageHelp({ tab, editing }: PageHelpProps) {
  const section = HELP[tab === 'content' && editing ? 'editor' : tab];
  if (!section) return null;

  return (
    <Card className="mt-10">
      <CardHeader title={`How this page works: ${section.title}`} icon={<HelpCircle className="w-4 h-4" />} description={section.intro} />
      <dl className="divide-y divide-neutral-200">
        {section.items.map((it) => (
          <div key={it.term} className="px-5 py-3 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-1 md:gap-6">
            <dt className="text-sm font-medium text-neutral-900">{it.term}</dt>
            <dd className="text-sm text-neutral-700 leading-relaxed">{it.text}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
