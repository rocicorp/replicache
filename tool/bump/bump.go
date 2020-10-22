package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"regexp"
	"runtime"
	"time"

	"github.com/alecthomas/kingpin"
	"github.com/blang/semver/v4"
	"github.com/pkg/errors"
)

var (
	app     = kingpin.New("bump", "Bump changes the version of the repc library and updates all required files.")
	version = app.Arg("version", "Version to update to.").Required().String()
)

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	v, err := semver.Make(*version)
	if err != nil {
		fmt.Println(errors.Wrap(err, "Invalid version"))
		return
	}

	rootDir, err := getRootDir()
	if err != nil {
		fmt.Println(errors.Wrap(err, "Could not find root directory"))
		return
	}

	oldVersion, err := updateCargoToml(rootDir, v.String())
	if err != nil {
		fmt.Println(errors.Wrap(err, "Could not update Cargo.toml"))
		return
	}

	fmt.Printf("Old version: %s\n", oldVersion)
	fmt.Printf("New version: %s\n", v)

	err = updateCargoLock(rootDir, v.String())
	if err != nil {
		fmt.Println(errors.Wrap(err, "Could not update Cargo.lock"))
		return
	}

	err = updateLicense(rootDir, *oldVersion, v)
	if err != nil {
		fmt.Println(errors.Wrap(err, "Could not update license"))
		return
	}

	err = commitGit(v)
	if err != nil {
		fmt.Println(errors.Wrap(err, "Could not commit release"))
		return
	}

	fmt.Println("Success! Committed version change. Don't forget to tag the release once it is has been merged.")
}

func updateLicense(rootDir string, oldVersion, newVersion semver.Version) error {
	if newVersion.LT(oldVersion) {
		fmt.Println("WARNING: new version is smaller than old version. Carefully check changed files to be sure this is what you want.")
	}

	f := path.Join(rootDir, "licenses", "BSL.txt")
	stuff, err := ioutil.ReadFile(f)
	if err != nil {
		return errors.Wrap(err, "Could not read BSL.txt")
	}
	re := regexp.MustCompile("Licensed Work:        repc (.*)\n")
	stuff, err = replaceFirst(stuff, re,
		fmt.Sprintf("Licensed Work:        repc %s\n", newVersion))
	if err != nil {
		return err
	}

	if newVersion.Major != oldVersion.Major || newVersion.Minor != oldVersion.Minor {
		fmt.Println("Major or minor component changed. Updating Change Date.")
		re = regexp.MustCompile("Change Date:          (.*)\n")
		now := time.Now()
		stuff, err = replaceFirst(stuff, re,
			fmt.Sprintf("Change Date:          %d-%02d-%02d\n",
				now.Year()+2, now.Month(), now.Day()))
		if err != nil {
			return err
		}
	} else {
		fmt.Println("Patch release. Not updating Change Date.")
	}

	err = ioutil.WriteFile(f, stuff, 0644)
	if err != nil {
		return errors.Wrap(err, "Could not write BSL.txt")
	}

	return nil
}

func commitGit(newVersion semver.Version) error {
	err := ex("git", "commit", "-a", "-m", fmt.Sprintf("Bump version to %s.", newVersion))
	if err != nil {
		return err
	}
	return nil
}

func ex(args ...string) error {
	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	return cmd.Run()
}

func updateCargoToml(rootDir, newVersion string) (*semver.Version, error) {
	f := path.Join(rootDir, "Cargo.toml")
	stuff, err := ioutil.ReadFile(f)
	if err != nil {
		return nil, errors.Wrap(err, "Could not read Cargo.toml")
	}

	re := regexp.MustCompile(`version = "(.+?)"`)
	match := re.FindSubmatch(stuff)
	if len(match) < 2 {
		return nil, errors.New("Could not find existing version in Cargo.toml")
	}

	oldVersion := match[1]
	stuff, err = replaceFirst(stuff, re, fmt.Sprintf(`version = "%s"`, newVersion))
	if err != nil {
		return nil, errors.Wrap(err, "Could not find existing version in Cargo.toml")
	}

	err = ioutil.WriteFile(f, stuff, 0644)
	if err != nil {
		return nil, errors.Wrap(err, "Could not write new Cargo.toml")
	}

	sv, err := semver.Parse(string(oldVersion))
	if err != nil {
		return nil, errors.Wrap(err, "Existing version value not valid semver")
	}

	return &sv, nil
}

func updateCargoLock(rootDir, newVersion string) error {
	f := path.Join(rootDir, "Cargo.lock")
	stuff, err := ioutil.ReadFile(f)
	if err != nil {
		return errors.Wrap(err, "Could not read Cargo.lock")
	}

	re := regexp.MustCompile("\\[\\[package\\]\\]\nname = \"replicache-client\"\nversion = \"(.+?)\"")
	stuff, err = replaceFirst(stuff, re, fmt.Sprintf("[[package]]\nname = \"replicache-client\"\nversion = \"%s\"", newVersion))
	if err != nil {
		return errors.Wrap(err, "Could not update Cargo.lock")
	}

	err = ioutil.WriteFile(f, stuff, 0644)
	if err != nil {
		return errors.Wrap(err, "Could not write new Cargo.lock")
	}
	return nil
}

func getRootDir() (string, error) {
	_, filename, _, ok := runtime.Caller(1)
	if !ok {
		return "", errors.New("Could not get name of current file")
	}
	return path.Dir(path.Dir(path.Dir(filename))), nil
}

func replaceFirst(subject []byte, pattern *regexp.Regexp, replacement string) ([]byte, error) {
	count := 0
	r := pattern.ReplaceAllFunc(subject, func(match []byte) []byte {
		if count > 0 {
			return match
		}
		count++
		return []byte(replacement)
	})
	if count == 0 {
		return nil, fmt.Errorf("Could not find pattern: %s", pattern)
	}
	return r, nil
}
