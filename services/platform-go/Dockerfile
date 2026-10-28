FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -trimpath -o /out/platform ./cmd/platform
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/platform /platform
USER nonroot:nonroot
ENTRYPOINT ["/platform"]
