FROM debian:bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      build-essential \
      sudo \
      curl \
      gnupg \
      python3 \
      python3-pip \
 && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

ARG USER
ARG USERID
ARG GROUPID

RUN groupadd $USER -g $GROUPID && useradd -m $USER --uid $USERID --gid $GROUPID -G sudo

RUN mkdir -p /workspace \
 && chown sinclairs:sinclairs /workspace

USER sinclairs
WORKDIR /workspace

RUN mkdir -p ~/.npm-global \
    && npm config set prefix ~/.npm-global

RUN npm install -g @anthropic-ai/claude-code

ENV HOME=/home/sinclairs
ENV PATH="${HOME}/.npm-global/bin:${PATH}"

CMD ["bash"]
