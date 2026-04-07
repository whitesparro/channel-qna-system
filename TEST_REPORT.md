# Test Report

Manual test cases with expected and actual outcomes.

## Test Environment
- Docker Compose: `docker-compose up --build`
- Seed applied: `docker-compose exec app npx prisma db seed`
- App URL: http://localhost:3000

---

## Test Cases

### TC-01: Landing page loads and shows channel list
**Steps:** Navigate to http://localhost:3000  
**Expected:** Page loads with a list of seeded channels (general, javascript, python)  
**Result:** PASS — Channel list renders with post counts

---

### TC-02: Unauthenticated user cannot create a channel
**Steps:** Visit home page while logged out, click "Login to create channels"  
**Expected:** Redirected to login page; no create button shown  
**Result:** PASS — Create button hidden; login link shown

---

### TC-03: User can sign up with a new username
**Steps:** Go to /signup, enter username "testuser", password "test123", submit  
**Expected:** Account created, redirected to home  
**Result:** PASS

---

### TC-04: Duplicate username rejected on signup
**Steps:** Try to sign up with username "alice" (already exists)  
**Expected:** Error message "User already exists"  
**Result:** PASS

---

### TC-05: Login with correct credentials
**Steps:** Go to /login, enter "alice" / "password123"  
**Expected:** Logged in, redirected to home, username shown in nav  
**Result:** PASS

---

### TC-06: Login with wrong password
**Steps:** Go to /login, enter "alice" / "wrongpassword"  
**Expected:** Error message shown, not logged in  
**Result:** PASS — "Invalid password" error shown

---

### TC-07: Authenticated user can create a channel
**Steps:** Login as alice, click "+ New Channel", enter name "typescript", submit  
**Expected:** New channel appears in channel list  
**Result:** PASS

---

### TC-08: Authenticated user can create a post
**Steps:** Login as alice, select #general channel, fill in title + body, click "Post Question"  
**Expected:** New post appears at the top of the list  
**Result:** PASS

---

### TC-09: Unauthenticated post attempt blocked
**Steps:** While logged out, make POST to /api/posts with JSON body  
**Expected:** 401 Unauthorized response  
**Result:** PASS

---

### TC-10: User can reply to a post
**Steps:** Login, select a channel, type reply in input, press Enter or click Reply  
**Expected:** Reply appears under the post  
**Result:** PASS

---

### TC-11: Nested reply (reply to a reply)
**Steps:** Click "↩ Reply" on an existing reply, type nested reply, submit  
**Expected:** Reply appears indented under parent reply  
**Result:** PASS — Rendered in tree with visual indent

---

### TC-12: Upvote a post
**Steps:** Login as bob, click ▲ on a post  
**Expected:** Score increments by 1, button turns green  
**Result:** PASS

---

### TC-13: Remove vote (neutral)
**Steps:** Click ▲ again on the same post you already upvoted  
**Expected:** Score returns to previous value  
**Result:** PASS — Toggle to neutral works

---

### TC-14: One vote per user per post enforced
**Steps:** Try to POST /api/votes twice with same userId + postId  
**Expected:** Second call updates the vote, not creates a duplicate  
**Result:** PASS — Upsert logic works correctly

---

### TC-15: Upload screenshot with post
**Steps:** Login, create a post and attach a PNG file (< 5MB), submit  
**Expected:** Post appears with image displayed below body  
**Result:** PASS

---

### TC-16: Reject non-image file upload
**Steps:** Try to upload a .pdf or .exe file  
**Expected:** Error: "Only PNG, JPEG, WebP allowed"  
**Result:** PASS — File input restricted + server validates

---

### TC-17: Reject file over 5MB
**Steps:** Attempt to upload a 6MB PNG  
**Expected:** Error: "File too large (max 5MB)"  
**Result:** PASS

---

### TC-18: Admin can delete a post
**Steps:** Login as admin, go to a channel, click "Delete Post", confirm  
**Expected:** Post and its replies removed from the list  
**Result:** PASS

---

### TC-19: Admin panel lists users and channels
**Steps:** Login as admin, go to /admin  
**Expected:** All users and channels listed with delete buttons  
**Result:** PASS

---

### TC-20: Non-admin cannot access admin panel
**Steps:** Login as alice (USER role), navigate to /admin  
**Expected:** "Access Denied" message  
**Result:** PASS

---

### TC-21: Admin can remove a user
**Steps:** Login as admin, go to /admin, click "Remove User" for bob, confirm  
**Expected:** User removed from list  
**Result:** PASS — bob's existing posts remain but authorId set to null

---

### TC-22: Search — content substring search
**Steps:** Go to /search, select "Search Content", type "React", click Search  
**Expected:** Posts/replies containing "React" appear  
**Result:** PASS

---

### TC-23: Search — by author
**Steps:** Select "By Author", type "alice", search  
**Expected:** Posts and replies authored by alice appear  
**Result:** PASS

---

### TC-24: Search — most active users
**Steps:** Select "Most Active Users", click Search  
**Expected:** Users ranked by post count, descending  
**Result:** PASS

---

### TC-25: Search — highest rated posts
**Steps:** Select "Highest Rated Posts", click Search  
**Expected:** Posts sorted by net vote score, highest first  
**Result:** PASS

---

### TC-26: Logout clears session
**Steps:** Login, click Logout  
**Expected:** Redirected/refreshed, username no longer shown, write actions blocked  
**Result:** PASS

---

### TC-27: Empty channel shows empty state
**Steps:** Create a new channel, open it  
**Expected:** "No posts yet" empty state shown  
**Result:** PASS

---

### TC-28: Docker cold start
**Steps:** `docker-compose down -v && docker-compose up --build`  
**Expected:** App starts, migrations apply, seed runs, app accessible at :3000  
**Result:** PASS
