FONT_SIZE ?= 14
PRESENTATION ?= presentation.md

.PHONY: present notes

present:
	kitty -o font_size=$(FONT_SIZE) presenterm --publish-speaker-notes "$(PRESENTATION)"

notes:
	kitty -o font_size=$(FONT_SIZE) presenterm --listen-speaker-notes "$(PRESENTATION)"
