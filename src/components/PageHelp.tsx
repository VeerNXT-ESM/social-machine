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
    intro: 'A place to keep pictures and videos for your posts.',
    items: [
      { term: 'Upload media', text: 'Press the button or drag files onto the dashed box. Pictures show as thumbnails; the trash icon on a thumbnail removes it.' },
      { term: 'This page is still a preview', text: 'Files added here are kept only until you close or refresh the page, and are not yet saved permanently. The sample files shown are examples.' },
      { term: 'Where the AI images are', text: 'Images the app creates for your posts are stored safely in the cloud and appear inside each post. They are not listed on this page yet.' },
    ],
  },
  campaigns: {
    title: 'Campaigns',
    intro: 'A campaign is a group of posts built around one theme, such as a product launch or a series on skills.',
    items: [
      { term: 'The cards', text: 'Each card shows a campaign\'s name, stage (Active, Planned or Completed), a short description and how many posts it holds.' },
      { term: 'This page is still a preview', text: 'The campaigns shown are samples. When you type a campaign name on the Create page, it is saved with that content, but it does not appear on this page yet.' },
      { term: 'Turn an article into a 2-week campaign', text: 'A demonstration of an idea: paste an article and a five-post sequence is planned. It adds an example card but does not write the posts yet.' },
    ],
  },
  analytics: {
    title: 'Analytics',
    intro: 'Will show how your posts perform: how many people saw them and how they reacted.',
    items: [
      { term: 'The numbers shown are examples', text: 'Real results can only appear once the app is connected to your LinkedIn, X, Instagram and Facebook accounts, which has not been set up. Do not treat these figures as real.' },
      { term: 'Impressions, likes, comments, shares, clicks, saves', text: 'Impressions are the number of times a post was shown. The others count the different ways people reacted to it.' },
      { term: 'Performance by channel', text: 'The same figures split by platform, with an engagement percentage, which is reactions as a share of views.' },
    ],
  },
  settings: {
    title: 'Settings',
    intro: 'Controls how the app behaves and how posts should sound.',
    items: [
      { term: 'Publishing mode', text: 'Sandbox runs everything as a rehearsal. Manual publishing means you copy each post and post it yourself. The Buffer option is for a future connection and does not work yet.' },
      { term: 'Brand voice', text: 'The brand name, who you are speaking to, and the words to prefer. These guide the writing.' },
      { term: 'Prohibited words', text: 'Words that must never appear in posts. "Agniveer" is on this list. The app checks generated posts against it.' },
      { term: 'Save settings', text: 'Press it after any change. These settings are kept in this browser on this computer, so they will not follow you to another computer yet.' },
      { term: 'Developer tools', text: 'The test campaign creates two sample pieces of content with images and runs them through the whole process. It uses a small amount of AI credit each time, so it is meant for testing, not everyday use.' },
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
