I want you to fully configure the Android project for proper Release APK generation and document the entire process so I can independently build future releases without your assistance.

## 1. Release Build Configuration

- Inspect the existing Capacitor Android project and its Gradle configuration.
- Configure a proper signed Release build.
- Generate a dedicated release keystore if one does not already exist.
- If a keystore already exists, reuse it. Never replace an existing signing identity.
- Configure Gradle signing using secure local properties or environment variables.
- Keep signing credentials and keystore files out of Git.
- Ensure Debug and Release configurations remain separate.
- Preserve the existing application ID, package name, app identity, and functionality.

## 2. Build and Verification

Actually execute the required steps:

1. Synchronize Capacitor if necessary.
2. Generate a signed Release APK.
3. Verify the APK signature using `apksigner`.
4. Verify the application ID, version, permissions, and target SDK.
5. Confirm that the generated APK is a Release build and is properly signed.
6. Check for unnecessary permissions and potential security issues.
7. Generate an AAB as well, if the project supports it, for future Google Play publishing.

Do not just provide theoretical instructions. Complete the configuration and build the actual files.

## 3. Create a Complete Documentation File

Create:

`docs/ANDROID_RELEASE_GUIDE.md`

This is a mandatory deliverable.

Write the guide as a practical step-by-step tutorial for me, assuming I will execute all future release builds manually from the Terminal without an AI agent.

It MUST include:

### A. Initial Setup (one-time only)

- Required tools and dependencies.
- How to create a release keystore.
- How to configure signing credentials.
- Where the keystore and configuration files are stored.
- How to protect them and back them up.
- Which files must never be committed to Git.

### B. Every Future Release

Give me the exact commands, in the correct execution order, to:

1. Navigate to the project directory.
2. Update the web application build if required.
3. Synchronize Capacitor with Android.
4. Build a signed Release APK.
5. Build a signed Release AAB.
6. Verify the APK signature.
7. Verify the application ID and version.
8. Copy the generated files into a clearly named release directory.

### C. Useful Commands

Include commands for:

- Cleaning the Gradle build.
- Checking Gradle tasks.
- Listing available Android SDK/build tools.
- Inspecting APK metadata.
- Verifying signing certificates.
- Checking APK permissions.

### D. Troubleshooting

Explain common errors and their solutions, especially:

- Missing keystore.
- Incorrect passwords.
- Signing configuration errors.
- Gradle build failures.
- Missing Android SDK tools.
- Capacitor synchronization problems.
- Version code conflicts.
- APK installation and signature mismatch errors.

### E. Google Play Preparation

Explain the difference between APK and AAB and which one should be used for:

- Sharing APK directly with friends.
- Publishing on Google Play.
- Updating an existing installation.

## 4. Important Requirements

- All commands must be copy-paste ready for my actual project structure.
- Do not use placeholder paths if you can determine the actual paths.
- Clearly distinguish one-time setup commands from commands I will run for every release.
- Document the actual configuration you implemented, not a generic Gradle tutorial.
- Never expose passwords in terminal commands or documentation.
- Do not regenerate the keystore on subsequent builds.
- Do not change game functionality or UI.
- Do not disable Google Play Protect or recommend bypassing security warnings.

## 5. Final Report

When finished, provide:

1. The exact path of the generated signed Release APK.
2. The exact path of the generated AAB.
3. Confirmation that APK signature verification passed.
4. The keystore location (never reveal its password).
5. The documentation file path.
6. The exact short command sequence I need to run for every future Release build.

**Most importantly: I want to understand and own the release process. The Markdown guide must be complete enough that I never need to ask an agent to generate a Release APK for me again.**
