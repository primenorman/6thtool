import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Plus, ChevronLeft, Send, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flame, CheckCircle, HelpCircle } from "lucide-react";

const TABS = [
  { label: "All", value: "all" },
  { label: "Week 1", value: "week_1" },
  { label: "Week 2", value: "week_2" },
  { label: "Week 3", value: "week_3" },
  { label: "Week 4", value: "week_4" },
  { label: "Week 5", value: "week_5" },
  { label: "Week 6", value: "week_6" },
  { label: "Neural Lab", value: "neural_lab" },
];

const REACTION_TYPES = [
  { type: "fire", icon: Flame, label: "Fire" },
  { type: "got_it", icon: CheckCircle, label: "Got it" },
  { type: "question", icon: HelpCircle, label: "Question" },
] as const;

interface ForumPost {
  id: string;
  userId: string;
  moduleContext: string;
  title: string;
  content: string;
  createdAt: string;
  displayName: string | null;
  currentLevel: string | null;
  replyCount: number;
}

interface ForumReply {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  displayName: string | null;
  currentLevel: string | null;
}

interface Reaction {
  targetId: string;
  targetType: string;
  type: string;
  count: number;
  userReacted: boolean;
}

interface PostDetail {
  post: ForumPost & { displayName: string | null; currentLevel: string | null };
  replies: ForumReply[];
  reactions: Reaction[];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

type View = "list" | "detail" | "new";

export default function CommunityPage() {
  const { user } = useAuth() as any;
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<View>("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newContext, setNewContext] = useState("all");
  const [replyContent, setReplyContent] = useState("");

  const postsUrl =
    activeTab === "all"
      ? "/api/forum/posts"
      : `/api/forum/posts?context=${activeTab}`;

  const { data: posts = [], isLoading: postsLoading } = useQuery<ForumPost[]>({
    queryKey: ["/api/forum/posts", activeTab],
    queryFn: async () => {
      const res = await apiRequest("GET", postsUrl);
      return res.json();
    },
  });

  const { data: postDetail, isLoading: detailLoading } = useQuery<PostDetail>({
    queryKey: ["/api/forum/posts", selectedPostId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/forum/posts/${selectedPostId}`);
      return res.json();
    },
    enabled: !!selectedPostId && view === "detail",
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/forum/posts", {
        title: newTitle,
        content: newContent,
        moduleContext: newContext,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setNewTitle("");
      setNewContent("");
      setNewContext("all");
      setView("list");
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/forum/posts/${selectedPostId}/replies`, {
        content: replyContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/forum/posts", selectedPostId],
      });
      setReplyContent("");
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (payload: {
      postId?: number;
      replyId?: number;
      type: string;
    }) => {
      await apiRequest("POST", "/api/forum/reactions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/forum/posts", selectedPostId],
      });
    },
  });

  function openPost(postId: string) {
    setSelectedPostId(postId);
    setView("detail");
  }

  function goBack() {
    setView("list");
    setSelectedPostId(null);
    setReplyContent("");
  }

  function getReaction(
    targetId: number,
    targetType: string,
    type: string
  ): Reaction | undefined {
    return postDetail?.reactions.find(
      (r) =>
        r.targetId === targetId &&
        r.targetType === targetType &&
        r.type === type
    );
  }

  if (view === "new") {
    return (
      <AppLayout title="Community" subtitle="New Post">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("list")}
            data-testid="button-back-to-list"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="post-title">
                  Title
                </label>
                <Input
                  id="post-title"
                  placeholder="What's on your mind?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  data-testid="input-post-title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="post-context">
                  Context
                </label>
                <Select value={newContext} onValueChange={setNewContext}>
                  <SelectTrigger
                    data-testid="select-post-context"
                    id="post-context"
                  >
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABS.map((tab) => (
                      <SelectItem
                        key={tab.value}
                        value={tab.value}
                        data-testid={`select-option-${tab.value}`}
                      >
                        {tab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="post-content">
                  Content
                </label>
                <Textarea
                  id="post-content"
                  placeholder="Share your thoughts, questions, or insights..."
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  data-testid="textarea-post-content"
                />
              </div>

              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={
                  !newTitle.trim() ||
                  !newContent.trim() ||
                  createPostMutation.isPending
                }
                data-testid="button-submit-post"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (view === "detail" && selectedPostId) {
    const post = postDetail?.post;
    const replies = postDetail?.replies ?? [];

    return (
      <AppLayout title="Community" subtitle={post?.title ?? "Post"}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            data-testid="button-back-to-list"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {detailLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : post ? (
            <>
              <Card data-testid={`post-detail-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.displayName || "Anonymous"}
                        </span>
                        {post.currentLevel && (
                          <Badge variant="secondary" className="no-default-hover-elevate">
                            {post.currentLevel}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p
                    className="text-sm whitespace-pre-wrap"
                    data-testid="text-post-content"
                  >
                    {post.content}
                  </p>

                  <div className="flex items-center gap-1">
                    {REACTION_TYPES.map(({ type, icon: Icon, label }) => {
                      const reaction = getReaction(post.id, "post", type);
                      return (
                        <Button
                          key={type}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "gap-1 toggle-elevate",
                            reaction?.userReacted && "toggle-elevated"
                          )}
                          onClick={() =>
                            reactionMutation.mutate({ postId: post.id, type })
                          }
                          data-testid={`button-reaction-post-${type}`}
                        >
                          <Icon className="w-4 h-4" />
                          {reaction?.count ? (
                            <span className="text-xs">{reaction.count}</span>
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                </h3>

                {replies.map((reply) => (
                  <Card key={reply.id} data-testid={`reply-${reply.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {reply.displayName || "Anonymous"}
                        </span>
                        {reply.currentLevel && (
                          <Badge variant="secondary" className="no-default-hover-elevate">
                            {reply.currentLevel}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {reply.content}
                      </p>

                      <div className="flex items-center gap-1">
                        {REACTION_TYPES.map(({ type, icon: Icon }) => {
                          const reaction = getReaction(
                            reply.id,
                            "reply",
                            type
                          );
                          return (
                            <Button
                              key={type}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "gap-1 toggle-elevate",
                                reaction?.userReacted && "toggle-elevated"
                              )}
                              onClick={() =>
                                reactionMutation.mutate({
                                  replyId: reply.id,
                                  type,
                                })
                              }
                              data-testid={`button-reaction-reply-${reply.id}-${type}`}
                            >
                              <Icon className="w-4 h-4" />
                              {reaction?.count ? (
                                <span className="text-xs">
                                  {reaction.count}
                                </span>
                              ) : null}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Write a reply..."
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="flex-1"
                        data-testid="textarea-reply-content"
                      />
                      <Button
                        size="icon"
                        onClick={() => createReplyMutation.mutate()}
                        disabled={
                          !replyContent.trim() ||
                          createReplyMutation.isPending
                        }
                        data-testid="button-submit-reply"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Post not found.
            </p>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Community"
      subtitle="Connect with fellow players"
      headerRight={
        <Button
          size="sm"
          onClick={() => setView("new")}
          data-testid="button-new-post"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Post
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          data-testid="community-tab-filter"
        >
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.value)}
              className="whitespace-nowrap"
              data-testid={`button-tab-${tab.value}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No posts yet. Be the first to start a discussion!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="hover-elevate cursor-pointer"
                onClick={() => openPost(post.id)}
                data-testid={`post-card-${post.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-medium text-sm truncate">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.displayName || "Anonymous"}
                        </span>
                        {post.currentLevel && (
                          <Badge
                            variant="secondary"
                            className="no-default-hover-elevate"
                          >
                            {post.currentLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime(post.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.replyCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
