import React, { useEffect, useState } from 'react';
import cx from 'classnames/bind';
import ReactMapGL, { Marker, NavigationControl, Popup } from 'react-map-gl';
import moment from 'moment-timezone';

import { formatAddress, settings, setTitle, strings } from '../helpers';
import Button from './Button';
import Icon from './Icon';
import Link from './Link';

export default function Meeting({ state, setState }) {
  const meeting = state.meetings[state.input.meeting];

  //scroll to top when you navigate to this page
  useEffect(() => {
    window.scroll(0, 0);
  }, [state.input.meeting]);

  if (!meeting) {
    //todo display an error somewhere
    return null;
  }

  const isApproxAddress = !formatAddress(meeting.formatted_address);

  const [popup, setPopup] = useState(true);

  const [viewport, setViewport] = useState({
    latitude: meeting.latitude,
    longitude: meeting.longitude,
    zoom: isApproxAddress ? 10 : 14,
  });

  //create a link for directions
  const iOS = navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  const isTempClosed = meeting.types.includes(strings.types.TC);

  const directionsUrl =
    isTempClosed || isApproxAddress
      ? undefined
      : `${iOS ? 'maps://' : 'https://www.google.com/maps'}?daddr=${
          meeting.latitude
        },${meeting.longitude}&saddr=Current+Location&q=${encodeURI(
          meeting.formatted_address
        )}`;

  //set page title
  setTitle(meeting.name);

  const weekdays = settings.weekdays
    .map((weekday, index) => ({
      name: strings[weekday],
      meetings: Object.values(state.meetings).filter(
        m =>
          m.formatted_address == meeting.formatted_address &&
          m.start?.day() == index
      ),
    }))
    .filter(e => e.meetings.length);

  const timeString = meeting.start
    ? `
      ${strings[settings.weekdays[meeting.start.format('d')]]},  
      ${meeting.start.format('h:mm a')}
      ${meeting.end ? ` – ${meeting.end.format('h:mm a')}` : ''}`
    : strings.appointment;

  return (
    <div className="flex-column flex-grow-1 d-flex meeting">
      <h1 className="font-weight-light mb-1">
        <Link meeting={meeting} />
      </h1>
      <h6 className="border-bottom mb-3 pb-2 d-flex align-items-center">
        <Icon icon="back" />
        <a
          href={window.location.pathname}
          onClick={e => {
            e.preventDefault();
            setViewport(null);
            setState({
              ...state,
              input: {
                ...state.input,
                meeting: null,
              },
            });
          }}
        >
          {strings.back_to_meetings}
        </a>
      </h6>
      <div className="row flex-grow-1">
        <div className="mb-3 col-md-4 mb-md-0">
          {directionsUrl && (
            <Button
              className="mb-3"
              href={directionsUrl}
              icon="directions"
              text={strings.get_directions}
            />
          )}
          <div className="list-group">
            <div className="d-grid gap-2 list-group-item py-3">
              <h5>{strings.meeting_information}</h5>
              <p className="meeting-time">{timeString}</p>
              {meeting.types && (
                <ul className="ms-4 meeting-types">
                  {meeting.types.sort().map((type, index) => (
                    <li key={index}>{type}</li>
                  ))}
                </ul>
              )}
              {meeting.notes && (
                <Paragraphs text={meeting.notes} className="meeting-notes" />
              )}
            </div>
            {(meeting.conference_provider || meeting.conference_phone) && (
              <div className="d-grid gap-2 list-group-item py-3">
                <h5>{strings.types.online}</h5>
                {meeting.conference_provider && (
                  <div className="d-grid gap-2 conference-provider">
                    <Button
                      className="conference-url"
                      href={meeting.conference_url}
                      icon="camera"
                      text={meeting.conference_provider}
                    />
                    {meeting.conference_url_notes && (
                      <Paragraphs
                        className="d-block text-muted conference-url-notes"
                        text={meeting.conference_url_notes}
                      />
                    )}
                  </div>
                )}
                {meeting.conference_phone && (
                  <Button
                    className="conference-phone"
                    href={`tel:${meeting.conference_phone}`}
                    icon="telephone"
                    text={strings.phone}
                  />
                )}
                {meeting.conference_phone_notes && (
                  <Paragraphs
                    className="d-block text-muted conference-phone-notes"
                    text={meeting.conference_phone_notes}
                  />
                )}
              </div>
            )}
            {(meeting.venmo || meeting.square || meeting.paypal) && (
              <div className="d-grid gap-2 list-group-item py-3">
                <h5>{strings.seventh_tradition}</h5>
                {meeting.venmo && (
                  <Button
                    className="venmo"
                    href={`https://venmo.com/${meeting.venmo.substr(1)}`}
                    icon="cash"
                    text="Venmo"
                  />
                )}
                {meeting.square && (
                  <Button
                    className="square"
                    href={`https://cash.app/${meeting.square}`}
                    icon="cash"
                    text="Cash App"
                  />
                )}
                {meeting.paypal && (
                  <Button
                    className="paypal"
                    href={meeting.paypal}
                    icon="cash"
                    text="PayPal"
                  />
                )}
              </div>
            )}
            <div className="d-grid gap-2 list-group-item py-3">
              {meeting.location && <h5>{meeting.location}</h5>}
              {meeting.formatted_address && (
                <p
                  className={cx({
                    'text-decoration-line-through text-muted': isTempClosed,
                  })}
                >
                  {meeting.formatted_address}
                </p>
              )}
              {meeting.location_notes && (
                <Paragraphs
                  className="location-notes"
                  text={meeting.location_notes}
                />
              )}
              {!isApproxAddress &&
                weekdays.map((weekday, index) => (
                  <div key={index}>
                    <h6 className="mt-2 mb-1">{weekday.name}</h6>
                    <ol className="list-unstyled">
                      {weekday.meetings.map((m, index) => (
                        <li key={index} style={{ paddingLeft: '5.25rem' }}>
                          <span
                            className="position-absolute text-muted text-nowrap text-right"
                            style={{
                              left: '1.25rem',
                              width: '4.5rem',
                            }}
                          >
                            {m.start.format('h:mm a')}
                          </span>
                          {m.slug === meeting.slug && <Link meeting={m} />}
                          {m.slug !== meeting.slug && (
                            <Link
                              meeting={m}
                              setState={setState}
                              state={state}
                            />
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
            </div>
            {(meeting.group || meeting.group_notes || meeting.district) && (
              <div className="d-grid gap-2 list-group-item py-3">
                {meeting.group && <h5>{meeting.group}</h5>}
                {meeting.group_notes && (
                  <Paragraphs
                    className="meeting-group-notes"
                    text={meeting.group_notes}
                  />
                )}
                {meeting.district && (
                  <p className="meeting-district">{meeting.district}</p>
                )}
              </div>
            )}
            {meeting.updated && (
              <div className="list-group-item">
                {strings.updated.replace(
                  '%updated%',
                  moment
                    .tz(meeting.updated, 'UTC')
                    .tz(settings.timezone)
                    .format('ll')
                )}
              </div>
            )}
          </div>

          {meeting.feedback_url && (
            <Button
              className="mt-3 feedback-url"
              href={meeting.feedback_url}
              icon="edit"
              text={strings.feedback}
            />
          )}
        </div>
        {state.capabilities.map && (
          <div className="col-md-8 map">
            {viewport && meeting.latitude && (
              <ReactMapGL
                className="rounded border bg-light"
                height="100%"
                mapStyle={settings.map.style}
                mapboxApiAccessToken={settings.map.key}
                onViewportChange={isApproxAddress ? undefined : setViewport}
                width="100%"
                {...viewport}
              >
                {!isApproxAddress && (
                  <>
                    <Marker
                      latitude={meeting.latitude}
                      longitude={meeting.longitude}
                      offsetLeft={-settings.map.markers.location.width / 2}
                      offsetTop={-settings.map.markers.location.height}
                    >
                      <div
                        onClick={() => setPopup(true)}
                        style={settings.map.markers.location}
                        title={meeting.location}
                      />
                    </Marker>
                    {popup && (
                      <Popup
                        closeOnClick={false}
                        latitude={meeting.latitude}
                        longitude={meeting.longitude}
                        offsetTop={-settings.map.markers.location.height}
                        onClose={() => setPopup(false)}
                      >
                        <div className="d-grid gap-2 ">
                          <h4 className="font-weight-light">
                            {meeting.location}
                          </h4>
                          <p
                            className={cx({
                              'text-decoration-line-through text-muted':
                                isTempClosed,
                            })}
                          >
                            {meeting.formatted_address}
                          </p>
                          {directionsUrl ? (
                            <Button
                              href={directionsUrl}
                              icon="directions"
                              text={strings.get_directions}
                            />
                          ) : (
                            <Button
                              className="btn-outline-danger disabled"
                              icon="close"
                              text={strings.types.TC}
                            />
                          )}
                        </div>
                      </Popup>
                    )}
                    <NavigationControl
                      className="d-none d-md-block"
                      onViewportChange={setViewport}
                      showCompass={false}
                      style={{ top: 10, right: 10 }}
                    />
                  </>
                )}
              </ReactMapGL>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

//return paragraphs from possibly-multiline string
function Paragraphs({ text, className }) {
  return (
    <div className={className}>
      {text
        .split('\n')
        .filter(e => e)
        .map((p, index) => (
          <p key={index}>{p}</p>
        ))}
    </div>
  );
}
