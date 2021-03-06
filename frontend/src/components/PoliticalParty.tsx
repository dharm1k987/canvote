import React,{useState, useEffect} from 'react';
import {loader} from "graphql.macro";
import {PoliticalParty} from "../interfaces/models";
import {useQuery, useMutation} from "@apollo/react-hooks";
import {AlertType} from "../enums/alert-type";
import {ApolloErrorAlert, GenericAlert, FilePicker, Loading } from "./shared";
import {SketchPicker} from 'react-color';
import { ApolloError } from 'apollo-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faTrash, faSave} from '@fortawesome/free-solid-svg-icons';

// GraphQL Queries

const LIST_POLITICAL_PARTIES = loader('../queries/listPoliticalParties.gql');
const CREATE_POLITICAL_PARTY = loader('../queries/createPoliticalParty.gql');
const UPDATE_POLITICAL_PARTY = loader('../queries/updatePoliticalParty.gql');
const DELETE_POLITICAL_PARTY = loader('../queries/deletePoliticalParty.gql');

// Interfaces

interface ListPoliticalPartiesProps {
    // A list of political parties. If none provided, retrieves all parties.
    politicalParties?: PoliticalParty[];
    // Make clickable (cursor pointer)
    clickable?: boolean;
    // If a political party is clicked on, call this
    onClickPoliticalParty?: (politicalParty: PoliticalParty) => void;
    // Map political parties with statistics for listing (key supposed to be id)
    mapPoliticalPartyWithStatistics?: Map<string, { 
        totalVoteCount: number,
        projectedSeats: number
    }>;
    // To retrieve all political parties after successful query, call this
    onRetrieveAllParties?: (parties: PoliticalParty[]) => void;
}

interface UpdatePoliticalPartyProps {
    // The political party to update. If no party is provided, creates a new one.
    toUpdate?: PoliticalParty;
    // When the political party has been deleted successfully, call this
    onDeleteSuccess?: () => void;
}

// Components

/**
 * Component that lists out the political parties.
 */
export const ListPoliticalParties = (props: ListPoliticalPartiesProps) => {
    const { loading, error, data } = useQuery<{ politicalParties: PoliticalParty[] }>(LIST_POLITICAL_PARTIES, { onCompleted: (data) => {
        if (props.onRetrieveAllParties) {
            props.onRetrieveAllParties(data.politicalParties as PoliticalParty[]);
        }
    }});

    // Handle specific cases
    if (loading) return (<Loading />);
    if (error) return (<GenericAlert message="There was an error loading political parties. If this error persists, please contact support."
                                     type={ AlertType.danger } />);
    if (data && data.politicalParties.length === 0)
                                     return (<GenericAlert message="There are no political parties at the moment." type={ AlertType.info } />);

    // Political Parties must be from Apollo client to retrieve cache changes
    let politicalParties: Array<PoliticalParty> = !props.politicalParties ? data.politicalParties : 
        data.politicalParties.filter((party) => props.politicalParties.findIndex(propsParty => propsParty.id === party.id) !== -1);

    // Order by projected seat count
    const politicalPartiesOrdered = () => {
        if (props.mapPoliticalPartyWithStatistics) {
            return politicalParties.sort((a, b) => {
                // Don't change order if both not in map
                if (!props.mapPoliticalPartyWithStatistics.has(a.id) && !props.mapPoliticalPartyWithStatistics.has(b.id)) return 0;
                // If only one of them is in the map, they should be shorted first
                if (!props.mapPoliticalPartyWithStatistics.has(b.id)) return -1;
                if (!props.mapPoliticalPartyWithStatistics.has(a.id)) return 1;
    
                if (props.mapPoliticalPartyWithStatistics.get(a.id).projectedSeats > props.mapPoliticalPartyWithStatistics.get(b.id).projectedSeats) {
                    return -1; // a has more seats than b; place a first
                } else if (props.mapPoliticalPartyWithStatistics.get(a.id).projectedSeats < props.mapPoliticalPartyWithStatistics.get(b.id).projectedSeats) {
                    return 1; // b has more seats than a; place b first
                }
    
                return 0;
            });
        }

        return politicalParties;
    };

    return (
        <ul className="pp-list">
            {
                politicalParties && politicalPartiesOrdered().map((party: PoliticalParty) => (
                    <li key={party.id} 
                        title={ party.name }
                        className={ props.clickable ? "clickable" : "" }
                        onClick={ () => (props.onClickPoliticalParty && props.onClickPoliticalParty(party)) }
                        style={ { borderColor: party.colour } }>
                        <div className="pp-item--logo">
                            <img src={ process.env.REACT_APP_VOTING_SERVICE_BASE_URL + party.logo.location }
                                    alt={ party.name } />
                        </div>
                        <div className={ "pp-item--info" + (props.mapPoliticalPartyWithStatistics ? " w-stats" : '') } style={ { borderTopColor: party.colour } }>
                            {
                                props.mapPoliticalPartyWithStatistics ? (
                                    <div className="stat-layout">
                                        <div className="stat-general-info">
                                            <h3 style={ { color: party.colour } }>{ party.name }</h3>
                                            {
                                                props.mapPoliticalPartyWithStatistics.has(party.id) ? (
                                                    <div className="stat-item">Total # of votes: <strong>{ props.mapPoliticalPartyWithStatistics.get(party.id).totalVoteCount }</strong></div>
                                                ) : (
                                                    <div className="stat-item">Total # of votes: <strong>---</strong></div>
                                                )
                                            }
                                        </div>
                                        <div className="stat-projected-seats">
                                        {
                                            props.mapPoliticalPartyWithStatistics.has(party.id) ? (
                                                <div className="stat-item">{ props.mapPoliticalPartyWithStatistics.get(party.id).projectedSeats }</div>
                                            ) : (
                                                <div className="stat-item">---</div>
                                            )
                                        }
                                            <div className="stat-item-title">Projected Seats</div>
                                        </div>
                                    </div>
                                ) : (
                                    <h3 className="m-0" style={ { color: party.colour } }>{ party.name }</h3>
                                )
                            }
                        </div>
                    </li>
                ))
            }
        </ul>
    );
};

/**
 * Component that updates a political party from the props. If no political party is provided, it creates a new one
 * on submit. If there is one provided, there is an option to delete as well.
 */
export const UpdatePoliticalParty = (props: UpdatePoliticalPartyProps) => {
    // Set states
    const [name, setName] = useState<string>('');
    const [colour, setColour] = useState<string>('');
    // TODO: Ensure that logo can be uploaded optionally when updating
    const [logo, setLogo] = useState<File | null>(null);
    const [toUpdate, setToUpdate] = useState<PoliticalParty | null>(null);

    // Apollo hooks for mutations with error states
    const [createPP, { loading: loadingCreate, data: dataCreate }] = useMutation<{ createPoliticalParty: PoliticalParty }>(CREATE_POLITICAL_PARTY);
    const [errorCreate, setErrorCreate] = useState<ApolloError | null>(null);
    const [updatePP, { loading: loadingUpdate, data: dataUpdate }] = useMutation<{ updatePoliticalParty: PoliticalParty }>(UPDATE_POLITICAL_PARTY);
    const [errorUpdate, setErrorUpdate] = useState<ApolloError | null>(null);
    const [deletePP, { loading: loadingDelete, data: dataDelete }] = useMutation<{ deletePoliticalParty: PoliticalParty }>(DELETE_POLITICAL_PARTY);
    const [errorDelete, setErrorDelete] = useState<ApolloError | null>(null);

    // When the props change, reset name, colour, logo and toUpdate itself
    useEffect(() => {
        if (props.toUpdate && props.toUpdate.logo && props.toUpdate.logo.location) {
            // Deep clone hack
            const toUpdateClone = JSON.parse(JSON.stringify(props.toUpdate));
            // Update the location of the logo to full absolute path
            toUpdateClone.logo.location = `${process.env.REACT_APP_VOTING_SERVICE_BASE_URL}${props.toUpdate.logo.location}`;
            setToUpdate(toUpdateClone);
        }

        setName(props.toUpdate && props.toUpdate.name ? props.toUpdate.name : '');
        setColour(props.toUpdate && props.toUpdate.colour ? props.toUpdate.colour : '');
        setLogo(null);
    }, [props.toUpdate]);

    const handleSubmit = (event: React.SyntheticEvent): void => {
        event.preventDefault();
        if (props.toUpdate) {
            // Only update when necessary
            let toUpdate = { id: props.toUpdate.id };
            if (name) Object.assign(toUpdate, { name });
            if (colour !== props.toUpdate.colour) Object.assign(toUpdate, { colour });
            if (logo) Object.assign(toUpdate, { logo });

            updatePP({ variables: toUpdate }).catch(error => setErrorUpdate(error));
        } else {
            // Function to update the in-memory cache
            const updateCache = (proxy, { data: { createPoliticalParty }}) => {
                const data = proxy.readQuery({ query: LIST_POLITICAL_PARTIES });
                if (data) {
                    data.politicalParties.push(createPoliticalParty);
                    proxy.writeQuery({ query: LIST_POLITICAL_PARTIES, data });
                }
            };
            
            createPP({ variables: { name, colour, logo }, update: updateCache }).catch(error => setErrorCreate(error));
        }
    };

    const handleDelete = (): void => {
        if (props.toUpdate) {
            // Function to update the in-memory cache
            const updateCache = (client) => {
                const data = client.readQuery({ query: LIST_POLITICAL_PARTIES });
                const newData = { politicalParties: data.politicalParties.filter((i) => i.id !== props.toUpdate.id) };
                client.writeQuery({
                    query: LIST_POLITICAL_PARTIES,
                    data: newData,
                });
            };

            deletePP({ variables: { id: props.toUpdate.id }, update: updateCache })
                .then(() => {
                    if (props.onDeleteSuccess) props.onDeleteSuccess();
                }).catch(error => setErrorDelete(error));
        }
    };

    return (
        <div>
            <ApolloErrorAlert error={ errorCreate ? errorCreate : (errorUpdate ? errorUpdate : errorDelete) } />
            <GenericAlert shouldShow={ dataCreate !== undefined || dataUpdate !== undefined || dataDelete !== undefined } 
                          message={ 
                              dataCreate ? (
                                <span>The political party, <strong>{ (dataCreate.createPoliticalParty as PoliticalParty).name}</strong>, has been added to the election.</span>
                              ) : (
                                dataUpdate ? (
                                    <span>The political party, <strong>{ (dataUpdate.updatePoliticalParty as PoliticalParty).name}</strong>, has been updated in the election.</span>
                                ) : (
                                  dataDelete && <span>The political party, <strong>{ toUpdate.name }</strong>, has been deleted in the election.</span>
                                )
                              )
                          }
                          type={ AlertType.success } />
            {
                !dataDelete && (
                    <form onSubmit={ handleSubmit }>
                        <div className="form-group">
                            <label className="required">
                                Name of Political Party
                                <input type="text"
                                    className="form-control"
                                    value={ name }
                                    onChange={ event => setName(event.target.value) }
                                    required />
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="required">
                                Colour of Political Party
                                <SketchPicker color={ colour }
                                            onChange={ (colour) => setColour(colour.hex) }
                                            disableAlpha={ true }
                                            presetColors={ [
                                                { color: '#D71920', title: 'Liberal Red' },
                                                { color: '#1D4880', title: 'Conservative Blue' },
                                                { color: '#F58220', title: 'NDP Orange' },
                                                { color: '#3D9B35', title: 'Green Party Green' },
                                            ]} />
                            </label>
                        </div>
                        <FilePicker label="Logo"
                                    required={ !toUpdate }
                                    presetFile={ toUpdate ? toUpdate.logo : null }
                                    accept="image/jpg,image/png,image/jpeg,image/gif"
                                    onFileSelected={ (file) => setLogo(file) } />
                        {
                            toUpdate ? (
                                <div className="btn-group">
                                    <button type="submit" 
                                            className="btn btn-success" 
                                            disabled={ loadingCreate || loadingUpdate || loadingDelete }>
                                        <FontAwesomeIcon icon={ faSave } className="fa-left" /> Save
                                    </button>
                                    <button className="btn btn-danger" onClick={ handleDelete } disabled={ loadingCreate || loadingUpdate || loadingDelete }>
                                        <FontAwesomeIcon icon={ faTrash } className="fa-left" />Delete
                                    </button>
                                </div>
                            ): (
                                <button type="submit" 
                                        className="btn btn-success" 
                                        disabled={ loadingCreate || loadingUpdate || loadingDelete }>
                                    <FontAwesomeIcon icon={ faSave } className="fa-left" /> Save
                                </button>
                            )
                        }
                    </form>
                )
            }
        </div>
    );
};
