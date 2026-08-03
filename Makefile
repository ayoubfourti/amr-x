.PHONY: help commands setup setup-docs setup-website dev docs website build check check-docs clean

help commands:
	npm run commands

setup:
	npm run setup

setup-docs:
	npm run setup:docs

setup-website:
	npm run setup:website

dev:
	npm run dev

docs:
	npm run docs

website:
	npm run website

build:
	npm run build

check:
	npm run check

check-docs:
	npm run check:docs

clean:
	npm run clean
